"use client";
// @refresh reset
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GUI } from "lil-gui";
import { DragControls } from "three/examples/jsm/controls/DragControls";
import {
  createBasket,
  setBasketBoundsOnTable,
  isBasketOnAnyBasket,
} from "../helpers/threeHelpers";

import { BasketSizeDialog } from "./BasketSizeDialog";

export const config = {
  boxScaling: 0.02,
  maxBaskets: 50,
};

export const Scene = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const [renderer, setRenderer] = useState<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const [pointer, setPointer] = useState<THREE.Vector2 | null>(null);
  const [camera, setCamera] = useState<THREE.OrthographicCamera | null>(null);

  const [basketSizeDialogOpen, setBasketSizeDialogOpen] = useState(false);
  const [newBasketPosition, setNewBasketPosition] = useState({ x: 0, y: 0 });
  const [allBasketBounds, setAllBasketBounds] = useState<THREE.Box2[]>([]);
  const [tableBounds, setTableBounds] = useState<THREE.Box2>(new THREE.Box2());

  useEffect(() => {
    const settings = {
      zoom: 1,
      fustrumSize: 20,
      tableColor: "#130f52",
      sidePanelColor: "#20692f",
    };
    const gui = new GUI();

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
    setCamera(camera);

    // resize viewport on resize
    const resizeViewport = () => {
      const width = window.innerWidth;
      const height = window.innerWidth / 1.5;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
    };

    window.addEventListener("resize", resizeViewport);

    // gui for zoom
    gui.add(settings, "zoom", 0, 3, 0.1).onChange((value: number) => {
      camera.zoom = value;
      camera.updateProjectionMatrix();
    });

    // gui for fustrum size
    gui.add(settings, "fustrumSize", 0, 50, 1).onChange((value: number) => {
      camera.left = (value * aspect) / -2;
      camera.right = (value * aspect) / 2;
      camera.top = value / 2;
      camera.bottom = value / -2;
      camera.updateProjectionMatrix();
    });
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

    //gui for table
    const tableFolder = gui.addFolder("table");
    tableFolder.add(table.position, "x", -5, 5, 0.5);
    tableFolder.add(table.position, "y", -10, 10, 1);
    tableFolder.add(table.position, "z", -1, 1, 0.1);
    tableFolder.addColor(settings, "tableColor").onChange(() => {
      table.material.color.set(settings.tableColor);
    });

    // add side panel to scene
    const sidePanelGeometry = new THREE.PlaneGeometry(3, 10);
    const sidePanelMaterial = new THREE.MeshBasicMaterial({ color: "#20692f" });
    const sidePanel = new THREE.Mesh(sidePanelGeometry, sidePanelMaterial);
    sidePanel.position.set(-6, 0, 0.1);
    scene.add(sidePanel);

    // side panel bounds
    const sidePanelBounds = new THREE.Box3().setFromObject(sidePanel);
    const sidePanelBox = new THREE.Box2(
      new THREE.Vector2(sidePanelBounds.min.x, sidePanelBounds.min.y),
      new THREE.Vector2(sidePanelBounds.max.x, sidePanelBounds.max.y)
    );

    // gui for side panel
    const sidePanelFolder = gui.addFolder("side panel");
    sidePanelFolder.add(sidePanel.position, "x", -10, 10, 1);
    sidePanelFolder.add(sidePanel.position, "y", -10, 10, 1);
    sidePanelFolder.add(sidePanel.position, "z", -1, 1, 0.1);
    sidePanelFolder.addColor(settings, "sidePanelColor").onChange(() => {
      sidePanel.material.color.set(settings.sidePanelColor);
    });

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
    const sidePanelAppleGeometry = new THREE.CircleGeometry(0.5, 32);
    const sidePanelAppleMaterial = new THREE.MeshBasicMaterial({
      color: "#0000ff",
    });
    const sidePanelApple = new THREE.Mesh(
      sidePanelAppleGeometry,
      sidePanelAppleMaterial
    );
    sidePanelApple.position.set(-6, 0, 0.2);
    scene.add(sidePanelApple);

    // set camera position
    camera.position.z = 1;

    // create draggable objects
    const draggableObjects: THREE.Object3D[] = [
      sidePanelBasket,
      sidePanelApple,
    ];

    // add event listener for pointer move
    const pointer = new THREE.Vector2();

    function onPointerMove(event: PointerEvent) {
      // calculate pointer position in normalized device coordinates
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -(event.clientY / (window.innerWidth / 1.5)) * 2 + 1;
      setPointer(pointer);
    }

    window.addEventListener("pointermove", onPointerMove);

    const dragControls = new DragControls(
      draggableObjects,
      camera,
      renderer.domElement
    );

    dragControls.addEventListener("dragend", (event) => {
      // calculate basket box bounds
      const basketBounds = new THREE.Box3().setFromObject(event.object);
      const basketBox = new THREE.Box2(
        new THREE.Vector2(basketBounds.min.x, basketBounds.min.y),
        new THREE.Vector2(basketBounds.max.x, basketBounds.max.y)
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(pointer, camera);
      const intersectsTable = raycaster.intersectObject(table);

      const isCursorOverTable = intersectsTable.length > 0;
      const isBasketOverTable = basketBox.intersectsBox(tableBox);
      const isBasketOverSidePanel = basketBox.intersectsBox(sidePanelBox);
      const isDraggingBasket = event.object === sidePanelBasket;
      const isDraggingApple = event.object === sidePanelApple;

      if (isDraggingBasket && isCursorOverTable) {
        // check if max baskets reached

        const { x, y } = intersectsTable[0].point;
        setNewBasketPosition({ x, y });
        setBasketSizeDialogOpen(true);
      }
      // reset basket position
      event.object.position.set(-6, 2, 0.2);
    });

    setRenderer(renderer);
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
    if (allBasketBounds.length === config.maxBaskets) {
      alert("You have too many baskets");
      setBasketSizeDialogOpen(false);
      return;
    }

    const { basket, basketBounds } = createBasket({
      width,
      height,
      x: newBasketPosition.x,
      y: newBasketPosition.y,
    });

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

    // get center of bounds - as position of the basket object is center based
    const centerBounds = movedBasketBounds.getCenter(new THREE.Vector2());
    basket.position.set(centerBounds.x, centerBounds.y, 0.2);

    sceneRef.current?.add(basket);

    setAllBasketBounds((state) => [...state, movedBasketBounds]);
    setBasketSizeDialogOpen(false);
  };
  return (
    <>
      <div ref={containerRef} />
      <BasketSizeDialog
        open={basketSizeDialogOpen}
        onClose={handleBasketSizeDialogClose}
      />
    </>
  );
};
