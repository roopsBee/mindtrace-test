"use client";
// @refresh reset
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import {
  createBasket,
  setBasketBoundsOnTable,
  isBasketOnAnyBasket,
  getApplePositionInBasket,
  createBasketBounds,
  positionBasketsByNumberOfApples,
} from "../helpers/threeHelpers";

import { BasketSizeDialog } from "./BasketSizeDialog";
import { initScene } from "../helpers/scene";

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
    // init scene
    const {
      camera,
      renderer,
      scene,
      dragControls,
      pointer,
      tableBox,
      table,
      sidePanelApple,
      sidePanelBasket,
      resizeViewport,
    } = initScene({
      containerRef,
    });

    sceneRef.current = scene;
    setTableBounds(tableBox);

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

          //add apple to basket

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

          const newApple = new THREE.Mesh(
            new THREE.CircleGeometry(config.circleRadius, 32),
            new THREE.MeshBasicMaterial({ color: "#0000ff" })
          );
          newApple.name = "apple";
          newApple.position.set(applePosition.x, applePosition.y, 0.4);
          intersectedBasket.add(newApple);
        }
      }

      // reset basket and apple position
      if (isDraggingBasket) event.object.position.set(-6, 2, 0.2);
      if (isDraggingApple) event.object.position.set(-6, 0, 0.2);
    });

    const animate = function () {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };

    animate();

    window.addEventListener("resize", resizeViewport);

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

    positionBasketsByNumberOfApples({ sortedBaskets, tableBounds });

    // update basket bounds
    const newAllBounds = allBasketBounds.map((_, index) => {
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
