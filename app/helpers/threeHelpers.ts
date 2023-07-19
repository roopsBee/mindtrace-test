import * as THREE from "three";

export const createBasket = ({ x, y }: { x: number; y: number }) => {
  const basketGeometry = new THREE.PlaneGeometry(1, 1);
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

export const getFreeBasketPosition = ({
  allBasketBounds,
  newBasketBounds,
}: {
  allBasketBounds: THREE.Box2[];
  newBasketBounds: THREE.Box2;
}) => {
  for (const basketBounds of allBasketBounds) {
    if (basketBounds.intersectsBox(newBasketBounds)) {
      // move basket to the right and try again
      const xDiff = basketBounds.max.x - newBasketBounds.min.x;
      const movedRightBasketBounds = newBasketBounds.translate(
        new THREE.Vector2(xDiff, 0)
      );

      for (const basketBounds of allBasketBounds) {
        if (basketBounds.intersectsBox(movedRightBasketBounds)) {
          return false;
        } else {
          return newBasketBounds;
        }
      }
    }
    return newBasketBounds;
  }
};
