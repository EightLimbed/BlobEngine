#version 430 core
out vec4 FragColor;

uniform float iTime;

layout(std430, binding = 0) buffer ChunkData {
    uint numPoints;
    vec4 points[]; // .xyz = center, .w ignored
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
float intersectCube(vec3 ro, vec3 rd, vec3 boxMin, vec3 boxMax) {
    vec3 invR = 1.0 / rd;
    vec3 t0s = (boxMin - ro) * invR;
    vec3 t1s = (boxMax - ro) * invR;

    vec3 tsmaller = min(t0s, t1s);
    vec3 tbigger  = max(t0s, t1s);

    float tmin = max(max(tsmaller.x, tsmaller.y), tsmaller.z);
    float tmax = min(min(tbigger.x, tbigger.y), tbigger.z);

    if (tmax < 0.0 || tmin > tmax) return -1.0; // no intersection
    return tmin;
}

// main ray stuff (trying so hard not to call it marching)
void main() {
    // camera setup
    float radius = 5.0;
    float angle = iTime * 0.6;
    vec3 ro = vec3(radius*cos(angle), 0.6, radius*sin(angle));
    vec3 lookAt = vec3(0.0, 0.0, 0.0);
    vec3 rd = getRayDir(gl_FragCoord.xy, vec2(800,600), ro, lookAt, 1.0);

    // find closest cube intersection
    float closestT = 1e6;
    vec3 hitPos = vec3(0.0);
    for (int i = 0; i < numPoints; i++) {
        vec3 center = points[i].xyz;
        vec3 halfSize = vec3(0.032); // cube half-size
        vec3 boxMin = center - halfSize;
        vec3 boxMax = center + halfSize;

        float t = intersectCube(ro, rd, boxMin, boxMax);
        if (t > 0.0 && t < closestT) {
            closestT = t;
            hitPos = ro + rd * t;
        }
    }

    if (closestT < 1e6) {
        FragColor = vec4(abs(hitPos), 1.0); // shade based on hit
    } else {
        FragColor = vec4(0.1,0.1,0.1,1.0); // background
    }
}