"use client";
// @refresh reset
import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { GUI } from "lil-gui";
import { DragControls } from "three/addons/controls/DragControls.js";

export const Scene = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // settings for dat gui
    const settings = {
      zoom: 1,
      fustrumSize: 20,
      tableColor: "#130f52",
      sidePanelColor: "#20692f",
    };
    const gui = new GUI();

    const sizes = {
      width: window.innerWidth,
      height: window.innerWidth / 1.5,
    };

    if (!containerRef.current) return;

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

    const controls = new DragControls(
      [sidePanelBasket, sidePanelApple],
      camera,
      renderer.domElement
    );

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

  return <div ref={containerRef} />;
};
