#version 430 core
out vec4 FragColor;

uniform float iTime;

layout(std430, binding = 0) buffer ChunkData {
    uint numPoints;
    vec4 points[]; // .xyz = center, .w ignored
};

layout(std430, binding = 1) buffer ChunkDataSort {
    uint isort[];
};

// camera shizzle
vec3 getRayDir(vec2 fragCoord, vec2 res, vec3 ro, vec3 lookAt, float zoom) {
    vec2 uv = (fragCoord - 0.5 * res) / res.y;
    vec3 f = normalize(lookAt - ro);
    vec3 r = normalize(cross(vec3(0,1,0), f));
    vec3 u = cross(f,r);
    return normalize(f + zoom * (uv.x*r + uv.y*u));
}

// ray and cube intersection
float intersectCube(vec3 ro, vec3 rd, vec3 center, vec3 size) {
    vec3 Min = center - size;
    vec3 Max = center + size;
    vec3 invR = 1.0 / rd;
    vec3 t0s = (Min - ro) * invR;
    vec3 t1s = (Max - ro) * invR;

    vec3 tsmaller = min(t0s, t1s);
    vec3 tbigger  = max(t0s, t1s);

    float tmin = max(max(tsmaller.x, tsmaller.y), tsmaller.z);
    float tmax = min(min(tbigger.x, tbigger.y), tbigger.z);

    if (tmax < 0.0 || tmin > tmax) return 1e6; // no intersection
    return tmin;
}

// main ray loop
void main() {
    // background color
    FragColor = vec4(0.1,0.1,0.1,1.0); // background
    // camera setup
    float radius = 5.0;
    float angle = iTime * 0.6;
    vec3 ro = vec3(radius*cos(angle), 0.6, radius*sin(angle));
    vec3 lookAt = vec3(0.0, 0.0, 0.0);
    vec3 rd = getRayDir(gl_FragCoord.xy, vec2(800,600), ro, lookAt, 1.0);

    // closest intersection setup
    float closestT = 1e6;
    vec3 hitPos = vec3(0.0);
    vec3 size = vec3(0.0625); // SDF radius

    // sorted array accelleration setup
    int signX = int(sign(rd.x)); //direction of marching
    int signY = int(sign(rd.y));
    int signZ = int(sign(rd.z));

    uint iX = (signX == 1) ? 0 : numPoints;
    uint iY = (signX == 1) ? numPoints : numPoints*2;
    uint iZ = (signX == 1) ? numPoints*2 : numPoints*3;

    for (int i = 0; i < numPoints; i++) {
        iX += signX;
        iY += signY;
        iZ += signZ;
        float tX = intersectCube(ro, rd, points[isort[iX]].xyz, size); // closest ray point in x
        float tY = intersectCube(ro, rd, points[isort[iY]].xyz, size); // closest ray point in y
        float tZ = intersectCube(ro, rd, points[isort[iZ]].xyz, size); // closest ray point in z
        float t;
        // getting closest point.
        vec3 hitPosX = ro + rd * tX;
        vec3 hitPosY = ro + rd * tY;
        vec3 hitPosZ = ro + rd * tZ;

        // compare distance between points and ray origin. Points that don't intersect will always lose this.
        float lenX = length(ro-hitPosX);
        float lenY = length(ro-hitPosY);
        float lenZ = length(ro-hitPosZ);

        if (lenX < lenY) { // fastest to check everything (always two comparisons)
            if (lenX < lenZ) {
                hitPos = hitPosX;
                t = tX;
            } else {
                hitPos = hitPosZ;
                t = tZ;
            }
        } else {
            if (lenY < lenZ) {
                hitPos = hitPosY;
                t = tY;
            } else {
                hitPos = hitPosZ;
                t = tZ;
            }
        }
        
        if (t < closestT) {
            FragColor = vec4(abs(hitPos), 1.0); // color based on hit position
            break;
        }
    }
}