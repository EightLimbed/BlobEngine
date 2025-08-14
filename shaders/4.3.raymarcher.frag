#version 430 core
out vec4 FragColor;

uniform float iTime;

layout(std430, binding = 0) buffer ChunkData {
    uint numPoints;
    vec4 points[]; // .xyz position, .w ignored
};

layout(std430, binding = 1) buffer ChunkDataSort {
    uint isort[]; // [xSort, ySort, zSort]
};

const float HIT_EPS   = 0.001;
const float MAX_DIST  = 80.0;
const int   MAX_STEPS = 128;

// helper
int axisOffset(int axis) { return axis * int(numPoints); }

float sdfPoint(vec3 p, uint idx) {
    return length(max(abs(p-points[idx].xyz)-0.1,0.0));
}

vec3 getRayDir(vec2 fragCoord, vec2 res, vec3 ro, vec3 lookAt, float zoom) {
    vec2 uv = (fragCoord - 0.5 * res) / res.y;
    vec3 f = normalize(lookAt - ro);
    vec3 r = normalize(cross(vec3(0,1,0), f));
    vec3 u = cross(f,r);
    return normalize(f + zoom * (uv.x*r + uv.y*u));
}

void main() {
    if (numPoints == 0u) {
        FragColor = vec4(1.0,0.0,0.0,1.0);
        return;
    }

    // camera
    float radius = 5.0;
    float angle  = iTime * 0.6;
    vec3 ro = vec3(radius*cos(angle),0.3,radius*sin(angle));
    vec3 lookAt = vec3(0.0,0.3,0.0);
    vec3 rd = getRayDir(gl_FragCoord.xy, vec2(800.0,600.0), ro, lookAt, 1.0);

    // marching indices for x/y/z
    int signX = int(sign(rd.x));
    int signY = int(sign(rd.y));
    int signZ = int(sign(rd.z));

    int ix = (signX > 0) ? 0 : int(numPoints-1);
    int iy = (signY > 0) ? 0 : int(numPoints-1);
    int iz = (signZ > 0) ? 0 : int(numPoints-1);

    float t = 0.0;
    for(int step=0; step<MAX_STEPS; step++) {
        vec3 pos = ro + t*rd;

        // get distances to current points
        float dx = sdfPoint(pos, isort[axisOffset(0)+ix]);
        float dy = sdfPoint(pos, isort[axisOffset(1)+iy]);
        float dz = sdfPoint(pos, isort[axisOffset(2)+iz]);

        // pick the closest
        float d = min(dx, min(dy, dz));

        if(d < HIT_EPS) {
            FragColor = vec4(vec3(0.6,1.1,1.1) - vec3(t/6.0),1.0);
            return;
        }

        t += d;
        if(t > MAX_DIST) break;

        // advance indices if the ray has passed the point along that axis
        if((signX > 0 && pos.x > points[isort[axisOffset(0)+ix]].x) ||
           (signX < 0 && pos.x < points[isort[axisOffset(0)+ix]].x)) {
            ix += signX;
            ix = clamp(ix, 0, int(numPoints-1));
        }
        if((signY > 0 && pos.y > points[isort[axisOffset(1)+iy]].y) ||
           (signY < 0 && pos.y < points[isort[axisOffset(1)+iy]].y)) {
            iy += signY;
            iy = clamp(iy, 0, int(numPoints-1));
        }
        if((signZ > 0 && pos.z > points[isort[axisOffset(2)+iz]].z) ||
           (signZ < 0 && pos.z < points[isort[axisOffset(2)+iz]].z)) {
            iz += signZ;
            iz = clamp(iz, 0, int(numPoints-1));
        }
    }

    FragColor = vec4(0.0,0.0,0.0,1.0);
}

