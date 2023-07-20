import { config } from "../components//Scene";
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

  basket.position.set(x, y, 0.2);

  const basketBounds3d = new THREE.Box3().setFromObject(basket);
  const basketBounds2d = new THREE.Box2(
    new THREE.Vector2(basketBounds3d.min.x, basketBounds3d.min.y),
    new THREE.Vector2(basketBounds3d.max.x, basketBounds3d.max.y)
  );
  return { basket, basketBounds: basketBounds2d };
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
