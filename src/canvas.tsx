import { WebGPUCanvas } from "./common/components/webgpu-canvas";
import * as p2 from "p2-es";
import * as THREE from "three";
export function Canvas() {
  type P2BodyWithUserData = p2.Body & {
    userData?: {
      environment?: boolean;
    };
  };
  const setEnvironmentUserData = (body: p2.Body) => {
    (body as P2BodyWithUserData).userData = { environment: true };
  };
  const _direction = new THREE.Vector3();
  const _velocity = new THREE.Vector3();
  const _position = new THREE.Vector3();
  const _offset = new THREE.Vector3();
  const _matrix4 = new THREE.Matrix4();
  const _cameraPositionTarget = new THREE.Vector3();
  const _cameraLookAtTarget = new THREE.Vector3();

  const VECTOR_UP = new THREE.Vector3(0, 1, 0);

  const MINGLING_CAT_TYPES = [
    "blackCat",
    "christmasCat",
    "classicCat",
    "grayCat",
    "triCat",
  ];

  const CAT_TYPES = {
    cupidCat: {
      id: 0,
      atlas: "./sprites/cupid-cat-sled.png",
      frames: 7,
    },
    blackCat: {
      id: 1,
      atlas: "./sprites/black-cat-skates.png",
      frames: 7,
    },
    christmasCat: {
      id: 2,
      atlas: "./sprites/christmas-cat-sled.png",
      frames: 14,
    },
    classicCat: {
      id: 3,
      atlas: "./sprites/classic-cat-skates.png",
      frames: 7,
    },
    grayCat: {
      id: 4,
      atlas: "./sprites/gray-cat-skates.png",
      frames: 7,
    },
    triCat: {
      id: 5,
      atlas: "./sprites/tri-cat-skates.png",
      frames: 7,
    },
  };
  const AUDIO_ASSETS = {
    terrible_cat_theme: {
      url: "./audio/terrible_cat_theme.ogg",
    },
    catLove1: {
      url: "./audio/cat_love1.ogg",
    },
    catLove2: {
      url: "./audio/cat_love2.ogg",
    },
    catLove3: {
      url: "./audio/cat_love3.ogg",
    },
    catSad1: {
      url: "./audio/cat_sad1.ogg",
    },
    catSad2: {
      url: "./audio/cat_sad2.ogg",
    },
    catSad3: {
      url: "./audio/cat_sad3.ogg",
    },
    catShove1: {
      url: "./audio/cat_shove1.ogg",
    },
    catShove2: {
      url: "./audio/cat_shove2.ogg",
    },
    catShoveHard1: {
      url: "./audio/cat_shovehard1.ogg",
    },
    catShoveHard2: {
      url: "./audio/cat_shovehard2.ogg",
    },
    partyHorn: {
      url: "./audio/party_horn.ogg",
    },
    fireworks1: {
      url: "./audio/fireworks_1.ogg",
    },
    fireworks2: {
      url: "./audio/fireworks_2.ogg",
    },
    fireworks3: {
      url: "./audio/fireworks_3.ogg",
    },
    fireworks4: {
      url: "./audio/fireworks_4.ogg",
    },
  };

  const AUDIO_CAT_LOVE: AudioAssetId[] = ["catLove1", "catLove2", "catLove3"];
  const AUDIO_CAT_SAD: AudioAssetId[] = ["catSad1", "catSad2", "catSad3"];
  const AUDIO_CAT_SHOVE: AudioAssetId[] = ["catShove1", "catShove2"];
  const AUDIO_CAT_SHOVE_HARD: AudioAssetId[] = [
    "catShoveHard1",
    "catShoveHard2",
  ];
  const AUDIO_FIREWORKS: AudioAssetId[] = [
    "fireworks1",
    "fireworks2",
    "fireworks3",
    "fireworks4",
  ];
  type GameState = Awaited<ReturnType<typeof init>>;

  type Assets = Awaited<ReturnType<typeof loadAssets>>;

  type AudioAssetId = keyof typeof AUDIO_ASSETS;

  type CharacterMovement = {
    speed: number;
    stopSpeed: number;
    surfaceFriction: number;
    acceleration: number;

    boostChargeTime?: number;
    lastBoostTime?: number;
  };
  type EntityType = {
    body?: p2.Body;
    transform?: THREE.Object3D;
    three?: THREE.Object3D;
    threeInstance?: {
      setMatrix: (matrix: THREE.Matrix4) => void;
      remove: () => void;
    };

    input?: CharacterInput;
    movement?: CharacterMovement;

    isPlayer?: boolean;
    isCharacter?: boolean;
    isCat?: boolean;
    isMinglingCat?: boolean;
    catType?: keyof typeof CAT_TYPES;

    isSingle?: boolean;
    partner?: CatEntity;

    match?: [CatEntity, CatEntity];

    trail?: {
      lastSpawnTime: number;
    };

    movementStatusEffect?: {
      type: "dizzy";
      countdown: number;
    };

    lifetime?: number;
  };
  type CatEntity = With<
    EntityType,
    "isCat" | "catType" | "transform" | "body" | "input"
  >;

  const createPlayer = (world: World, position: [number, number]) => {
    const playerShape = new p2.Circle({ radius: 0.75 });

    const playerBody = new p2.Body({
      mass: 1,
      type: p2.Body.DYNAMIC,
      fixedRotation: true,
      position,
    });

    playerBody.addShape(playerShape);

    world.create({
      isPlayer: true,
      isCharacter: true,
      body: playerBody,
      transform: new THREE.Object3D(),
      isCat: true,
      catType: "cupidCat",
      input: { wishDirection: [0, 0] },
      trail: {
        lastSpawnTime: 0,
      },
      movement: {
        speed: 10,
        stopSpeed: 3,
        surfaceFriction: 3,
        acceleration: 2,
      },
    });
  };

  const createMinglingCats = (world: World, physics: p2.World) => {
    const localPoint = [0, 0]
    const catBodyPadding = 1.5

    for (let i = 0; i < N_CATS; i++) {
        let attempt = 0

        while (attempt < 10) {
            attempt++

            const angle = Math.random() * Math.PI * 2
            const distance = THREE.MathUtils.mapLinear(Math.random(), 0, 1, 5, 22)
            const position = [Math.cos(angle) * distance, Math.sin(angle) * distance] as [number, number]

            let tooClose = false

            for (const body of physics.bodies) {
                if ((body as P2BodyWithUserData).userData?.environment) continue

                if (tooClose) break

                p2.vec2.subtract(localPoint, position, body.position)

                // is point inside circle?
                if (p2.vec2.squaredLength(localPoint) < (body.boundingRadius + catBodyPadding) ** 2) {
                    tooClose = true
                    break
                }
            }

            if (!tooClose) {
                createCat(world, position)
                break
            }
        }
    }

    
}
const createCat = (world: World, position: [number, number]) => {
    const body = new p2.Body({
        mass: 1,
        type: p2.Body.DYNAMIC,
        position,
        fixedRotation: true,
    })

    const shape = new p2.Circle({ radius: 0.5 })

    body.addShape(shape)

    world.create({
        isCharacter: true,
        isCat: true,
        isMinglingCat: true,
        catType: MINGLING_CAT_TYPES[Math.floor(Math.random() * MINGLING_CAT_TYPES.length)],
        isSingle: true,
        body,
        transform: new THREE.Object3D(),
        input: { wishDirection: [0, 0] },
        trail: {
            lastSpawnTime: 0,
        },
        movement: {
            speed: 3,
            stopSpeed: 3,
            surfaceFriction: 1,
            acceleration: 3,
        },
    })
}


  return (
    <>
      <WebGPUCanvas camera={{ position: [2, 1, 2] }}></WebGPUCanvas>
    </>
  );
  4;
}
