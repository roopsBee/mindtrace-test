"use client";
// @refresh reset
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { DragControls } from "three/examples/jsm/controls/DragControls";
import {
  createBasket,
  setBasketBoundsOnTable,
  isBasketOnAnyBasket,
  getApplePositionInBasket,
  createBasketBounds,
} from "../helpers/threeHelpers";

import { BasketSizeDialog } from "./BasketSizeDialog";

export const config = {
  boxScaling: 0.02,
  maxBaskets: 50,
  circleRadius: 2.5 * 0.02,
};

export interface BasketState {
  apples: number;
  uuid: string;
  maxApples: number;
  width: number;
  height: number;
}

export const Scene = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const sceneRef = useRef<THREE.Scene | null>(null);

  const [basketSizeDialogOpen, setBasketSizeDialogOpen] = useState(false);
  const [newBasketPosition, setNewBasketPosition] = useState({ x: 0, y: 0 });
  const basketObjectsRef = useRef<
    THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>[]
  >([]);
  const basketObjectsStateRef = useRef<BasketState[]>([]);
  const [allBasketBounds, setAllBasketBounds] = useState<THREE.Box2[]>([]);
  const [tableBounds, setTableBounds] = useState<THREE.Box2>(new THREE.Box2());

  useEffect(() => {
    // set size of canvas
    const sizes = {
      width: window.innerWidth,
      height: window.innerWidth / 1.5,
    };

    if (!containerRef.current) return;

    // create scene, camera, and renderer
    const frustumSize = 10;
    const scene = new THREE.Scene();
    const aspect = window.innerWidth / (window.innerWidth / 1.5);
    const camera = new THREE.OrthographicCamera(
      (frustumSize * aspect) / -2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      frustumSize / -2,
      0.1,
      100
    );
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(sizes.width, sizes.height);
    camera.position.z = 1;

    // resize viewport on resize
    const resizeViewport = () => {
      const width = window.innerWidth;
      const height = window.innerWidth / 1.5;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
    };

    window.addEventListener("resize", resizeViewport);

    // append canvas to div
    containerRef?.current.appendChild(renderer.domElement);

    // add table to scene
    const tableGeometry = new THREE.PlaneGeometry(12, 10);
    const tableMaterial = new THREE.MeshBasicMaterial({ color: "#130f52" });
    const table = new THREE.Mesh(tableGeometry, tableMaterial);
    table.position.x = 1.5;
    scene.add(table);

    // table bounds
    const tableBounds = new THREE.Box3().setFromObject(table);
    const tableBox = new THREE.Box2(
      new THREE.Vector2(tableBounds.min.x, tableBounds.min.y),
      new THREE.Vector2(tableBounds.max.x, tableBounds.max.y)
    );

    setTableBounds(tableBox);

    // add side panel to scene
    const sidePanelGeometry = new THREE.PlaneGeometry(3, 10);
    const sidePanelMaterial = new THREE.MeshBasicMaterial({ color: "#20692f" });
    const sidePanel = new THREE.Mesh(sidePanelGeometry, sidePanelMaterial);
    sidePanel.position.set(-6, 0, 0.1);
    scene.add(sidePanel);

    // add side panel basket to scene
    const sidePanelBasketGeometry = new THREE.PlaneGeometry(1, 1);
    const sidePanelBasketMaterial = new THREE.MeshBasicMaterial({
      color: "#ff0000",
    });
    const sidePanelBasket = new THREE.Mesh(
      sidePanelBasketGeometry,
      sidePanelBasketMaterial
    );
    sidePanelBasket.position.set(-6, 2, 0.2);
    scene.add(sidePanelBasket);

    // add side panel apple to scene
    const sidePanelAppleGeometry = new THREE.CircleGeometry(0.25, 32);
    const sidePanelAppleMaterial = new THREE.MeshBasicMaterial({
      color: "#0000ff",
    });
    const sidePanelApple = new THREE.Mesh(
      sidePanelAppleGeometry,
      sidePanelAppleMaterial
    );
    sidePanelApple.position.set(-6, 0, 0.3);
    scene.add(sidePanelApple);

    // create draggable objects
    const draggableObjects: THREE.Object3D[] = [
      sidePanelBasket,
      sidePanelApple,
    ];

    // update pointer state on pointer move
    const pointer = new THREE.Vector2();

    function onPointerMove(event: PointerEvent) {
      // calculate pointer position in normalized device coordinates
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -(event.clientY / (window.innerWidth / 1.5)) * 2 + 1;
    }

    window.addEventListener("pointermove", onPointerMove);

    // add drag controls
    const dragControls = new DragControls(
      draggableObjects,
      camera,
      renderer.domElement
    );

    dragControls.addEventListener("dragend", (event) => {
      // use raycaster to check if cursor is over table
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(pointer, camera);
      const intersectsTable = raycaster.intersectObject(table);
      const isCursorOverTable = intersectsTable.length > 0;

      const isDraggingBasket = event.object === sidePanelBasket;
      const isDraggingApple = event.object === sidePanelApple;

      // check if dragging basket and over table
      if (isDraggingBasket && isCursorOverTable) {
        const { x, y } = intersectsTable[0].point;
        setNewBasketPosition({ x, y });
        setBasketSizeDialogOpen(true);
      }

      //check if dragging apple and over basket
      if (isDraggingApple) {
        raycaster.setFromCamera(pointer, camera);
        const raycasterOverBaskets = raycaster.intersectObjects(
          basketObjectsRef.current
        );

        // filter out other apple meshes from raycaster
        const raycasterOverBasketsFiltered = raycasterOverBaskets.filter(
          (intersectedBasket) => intersectedBasket.object.name !== "apple"
        );

        if (raycasterOverBasketsFiltered.length > 0) {
          const intersectedBasket = raycasterOverBasketsFiltered[0].object;

          //add circle to basket
          const newApple = new THREE.Mesh(
            new THREE.CircleGeometry(config.circleRadius, 32),
            new THREE.MeshBasicMaterial({ color: "#0000ff" })
          );
          newApple.name = "apple";

          //update basket state
          const basketIndex = basketObjectsRef.current.findIndex(
            (basket) => basket.uuid === intersectedBasket.uuid
          );
          basketObjectsStateRef.current[basketIndex].apples += 1;

          // position apple in basket
          const applePosition = getApplePositionInBasket({
            basketState: basketObjectsStateRef.current[basketIndex],
          });

          if (!applePosition) {
            event.object.position.set(-6, 0, 0.2);
            alert("Basket is full!");
            return;
          }

          newApple.position.set(applePosition.x, applePosition.y, 0.4);
          intersectedBasket.add(newApple);
        }
      }

      // reset basket and apple position
      if (isDraggingBasket) event.object.position.set(-6, 2, 0.2);
      if (isDraggingApple) event.object.position.set(-6, 0, 0.2);
    });

    sceneRef.current = scene;

    const animate = function () {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      renderer.dispose();
      window.removeEventListener("resize", resizeViewport);
    };
  }, []);

  const handleBasketSizeDialogClose = ({
    width,
    height,
  }: {
    width: number;
    height: number;
  }) => {
    // check if max baskets reached
    if (allBasketBounds.length === config.maxBaskets) {
      alert("You have too many baskets");
      setBasketSizeDialogOpen(false);
      return;
    }

    const basket = createBasket({
      width,
      height,
      x: newBasketPosition.x,
      y: newBasketPosition.y,
    });

    const basketBounds = createBasketBounds({ basket });

    const movedBasketBounds = setBasketBoundsOnTable({
      basketBounds,
      tableBounds,
    });

    const isBasketBoundsInFreeSpace = isBasketOnAnyBasket({
      allBasketBounds,
      newBasketBounds: movedBasketBounds,
    });

    if (!isBasketBoundsInFreeSpace) {
      setBasketSizeDialogOpen(false);
      alert("Basket is on another basket, try placing it somewhere else");
      return;
    }

    const centerBounds = movedBasketBounds.getCenter(new THREE.Vector2());
    basket.position.set(centerBounds.x, centerBounds.y, 0.2);
    sceneRef.current?.add(basket);

    // calculate max apples a basket can hold
    basketObjectsRef.current.push(basket);
    const appleBox = (2.5 * 2) ** 2;
    const maxApples = (width * height) / appleBox;

    // set basket state
    basketObjectsStateRef.current.push({
      uuid: basket.uuid,
      apples: 0,
      maxApples,
      width,
      height,
    });
    setAllBasketBounds((state) => [...state, movedBasketBounds]);
    setBasketSizeDialogOpen(false);
  };

  const handleSort = () => {
    // sort baskets by number of apples
    const sortedBaskets = basketObjectsRef.current.toSorted((a, b) => {
      const applesInBasketA = a.children.length;
      const applesInBasketB = b.children.length;
      return applesInBasketB - applesInBasketA;
    });

    // reposition baskets is order
    let nextX = tableBounds.min.x;
    let nextY = tableBounds.max.y;
    const gap = 0.05;
    const rowEndX = tableBounds.max.x;

    sortedBaskets.forEach((basket) => {
      const basketWidth = basket.geometry.parameters.width;
      const basketHeight = basket.geometry.parameters.height;

      const newBasketPosition = new THREE.Vector3(
        nextX + basketWidth / 2,
        nextY - basketHeight / 2
      );

      // if basket is out of bounds, move to next row
      if (newBasketPosition.x + basketWidth / 2 + gap > rowEndX) {
        nextX = tableBounds.min.x;
        nextY -= 70 * config.boxScaling + gap;
        newBasketPosition.x = nextX + basketWidth / 2;
        newBasketPosition.y = nextY - basketHeight / 2;
      }

      basket.position.set(newBasketPosition.x, newBasketPosition.y, 0.2);

      nextX += basketWidth + gap;
    });

    // update basket bounds
    const newAllBounds = allBasketBounds.map((basketBounds, index) => {
      const basketObject = basketObjectsRef.current[index];
      const newBasketBounds = createBasketBounds({ basket: basketObject });
      return newBasketBounds;
    });
    setAllBasketBounds(newAllBounds);
  };
  return (
    <div className="relative">
      <div ref={containerRef} />
      <BasketSizeDialog
        open={basketSizeDialogOpen}
        onClose={handleBasketSizeDialogClose}
      />
      <button
        onClick={handleSort}
        className="absolute left-[8%] top-2/3 rounded border border-gray-800 bg-gray-200 p-2"
      >
        Sort
      </button>
    </div>
  );
};
