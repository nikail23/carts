const floorGroup = 0;
const carGroup = 1;
const wheelGroup = 2;
const axelGroup = 3;
const cubeGroup = 4;

function calculateColliderGroup(membership: number[], filter: number[]) {
  const membershipMask = membership.reduce((acc, group) => {
    return acc | (0b0000_0000_0000_0001 << group);
  }, 0b0000_0000_0000_0000);

  const filterMask = filter.reduce((acc, group) => {
    return acc | (0b0000_0000_0000_0001 << group);
  }, 0b0000_0000_0000_0000);

  return (membershipMask << 16) | filterMask;
}

export const FloorColliderGroup = calculateColliderGroup(
  [floorGroup],
  [carGroup, wheelGroup, cubeGroup]
);

export const CarColliderGroup = calculateColliderGroup(
  [carGroup],
  [carGroup, floorGroup, cubeGroup]
);

export const WheelColliderGroup = calculateColliderGroup(
  [wheelGroup],
  [wheelGroup, floorGroup, cubeGroup]
);

export const AxelColliderGroup = calculateColliderGroup([axelGroup], []);

export const CubeColliderGroup = calculateColliderGroup(
  [cubeGroup],
  [carGroup, wheelGroup, floorGroup]
);
