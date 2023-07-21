import * as THREE from "three";
import { DragControls } from "three/examples/jsm/controls/DragControls";

export const initScene = ({
  containerRef,
}: {
  containerRef: React.RefObject<HTMLDivElement>;
}):
  | {
      scene: THREE.Scene;
      tableBox: THREE.Box2;
      camera: THREE.OrthographicCamera;
      renderer: THREE.WebGLRenderer;
      dragControls: DragControls;
      pointer: THREE.Vector2;
      sidePanelBasket: THREE.Mesh;
      sidePanelApple: THREE.Mesh;
      table: THREE.Mesh;
      resizeViewport: () => void;
    }
  | undefined => {
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
  const draggableObjects: THREE.Object3D[] = [sidePanelBasket, sidePanelApple];

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

  return {
    scene,
    tableBox,
    camera,
    pointer,
    dragControls,
    renderer,
    sidePanelBasket,
    sidePanelApple,
    table,
    resizeViewport,
  };
};
