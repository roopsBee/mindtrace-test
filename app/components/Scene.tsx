"use client";
import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { GUI } from "lil-gui";

export const Scene = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // settings for dat gui
    const settings = {
      zoom: 1,
      fustrumSize: 20,
    };
    const gui = new GUI();

    const sizes = {
      width: window.innerWidth,
      height: window.innerWidth / 1.5,
    };

    if (!containerRef.current) return;

    const frustumSize = 20;
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

    containerRef?.current.appendChild(renderer.domElement);

    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
    camera.position.z = 1;

    const setZoom = (zoom: number) => {
      camera.zoom = 1.5;
      camera.updateProjectionMatrix();
    };

    const animate = function () {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      window.removeEventListener("resize", resizeViewport);
    };
  }, []);

  return <div ref={containerRef} />;
};
