import { BasketState, config } from "../components//Scene";
import * as THREE from "three";

export const createBasket = ({
  x,
  y,
  width,
  height,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
}) => {
  const basketGeometry = new THREE.PlaneGeometry(
    width * config.boxScaling,
    height * config.boxScaling
  );
  const basketMaterial = new THREE.MeshBasicMaterial({
    color: "#ff0000",
  });
  const basket = new THREE.Mesh(basketGeometry, basketMaterial);
  basket.name = "basket";

  basket.position.set(x, y, 0.2);

  return basket;
};

export const createBasketBounds = ({
  basket,
}: {
  basket: THREE.Mesh;
}): THREE.Box2 => {
  const basketBounds3d = new THREE.Box3().setFromObject(basket);
  const basketBounds2d = new THREE.Box2(
    new THREE.Vector2(basketBounds3d.min.x, basketBounds3d.min.y),
    new THREE.Vector2(basketBounds3d.max.x, basketBounds3d.max.y)
  );
  return basketBounds2d;
};

export const isBasketOnAnyBasket = ({
  allBasketBounds,
  newBasketBounds,
}: {
  allBasketBounds: THREE.Box2[];
  newBasketBounds: THREE.Box2;
}): boolean => {
  for (const basketBounds of allBasketBounds) {
    if (basketBounds.intersectsBox(newBasketBounds)) {
      return false;
    }
  }
  return true;
};

export const setBasketBoundsOnTable = ({
  tableBounds,
  basketBounds,
}: {
  tableBounds: THREE.Box2;
  basketBounds: THREE.Box2;
}): THREE.Box2 => {
  return basketBounds.intersect(tableBounds);
};

export const getApplePositionInBasket = ({
  basketState,
}: {
  basketState: BasketState;
}): THREE.Vector3 | false => {
  const basketWidth = basketState.width * config.boxScaling;
  const basketHeight = basketState.height * config.boxScaling;
  const appleRadius = config.circleRadius;
  const appleCount = basketState.apples - 1;

  // Calculate how many apples will fit in each row and in each column
  const applesPerRow = Math.floor(basketWidth / (2 * appleRadius));
  const applesPerColumn = Math.floor(basketHeight / (2 * appleRadius));

  // The starting x and y coordinates for the apples
  let startX = -basketWidth / 2 + appleRadius;
  let startY = basketHeight / 2 - appleRadius;
  // Calculate the row and column for this apple
  let row = Math.floor(appleCount / applesPerRow);
  let column = appleCount % applesPerRow;

  // If the row exceeds the maximum number of rows, the basket is full
  if (row >= applesPerColumn) {
    return false;
  }

  // Calculate the x and y coordinates for this apple
  let x = startX + column * 2 * appleRadius;
  let y = startY - row * 2 * appleRadius;

  console.log("apple x", x, "y", y);
  return new THREE.Vector3(x, y, 0);
};

export const sortBasketsByNumberOfApples = ({
  sortedBaskets,
  tableBounds,
}: {
  sortedBaskets: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>[];
  tableBounds: THREE.Box2;
}) => {
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
};
