import * as THREE from "three";
import { DragControls } from "three/examples/jsm/controls/DragControls";
import { getApplePositionInBasket } from "./threeHelpers";
import { BasketState, config } from "../components/Scene";

export const initDragControls = ({
  dragControls,
  camera,
  pointer,
  table,
  sidePanelBasket,
  sidePanelApple,
  setNewBasketPosition,
  setBasketSizeDialogOpen,
  basketObjectsRef,
  basketObjectsStateRef,
}: {
  dragControls: DragControls;
  camera: THREE.OrthographicCamera;
  pointer: THREE.Vector2;
  table: THREE.Mesh;
  sidePanelBasket: THREE.Mesh;
  sidePanelApple: THREE.Mesh;
  setNewBasketPosition: React.Dispatch<
    React.SetStateAction<{ x: number; y: number }>
  >;
  setBasketSizeDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  basketObjectsRef: React.MutableRefObject<THREE.Mesh[]>;
  basketObjectsStateRef: React.MutableRefObject<BasketState[]>;
}) => {
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
};
