#version 430 core
out vec4 FragColor;
  
uniform float iTime; // the time variable to animate from

layout(std430, binding = 0) buffer ChunkData {
    uint numPoints;
    vec4 points[];
};

layout(std430, binding = 1) buffer ChunkDataSort {
    uint isort[];
};

//softmin meatball kernel
float softmin(float a, float b, float k) {
    return -log(exp(-k*a)+exp(-k*b))/k;
}

int dominantAxis(vec3 dir) {
    vec3 a = abs(dir);
    return (a.x >= a.y && a.x >= a.z) ? 0 : ((a.y >= a.z) ? 1 : 2);
}

uint isubIndex(int axis, float order) {
    if (order == 1) {
        return axis * numPoints;
    } else {
        return (axis+1) * numPoints;
    }
}

float get_sdf(vec3 p, uint i) {
    float sdf = 1e6;
    float d = length(p-points[isort[i]].xyz)-0.1;
    sdf = d; //softmin(sdf,d,points[index].w); //.w represents the inverse of the pull strength
    return sdf;
}

//rays
vec3 getRayDir(vec2 fragCoord, vec2 res, vec3 ro, vec3 lookAt, float zoom) {
    vec2 uv = (fragCoord - 0.5 * res) / res.y;
    vec3 f = normalize(lookAt - ro);
    vec3 r = normalize(cross(vec3(0,1,0), f));
    vec3 u = cross(f, r);
    return normalize(f + zoom * (uv.x * r + uv.y * u));
}

void main(void) {
    // camera stuff
    float radius = 4.0;
    float angle = iTime * 0.6;
    vec3 ro = vec3(radius * cos(angle), 0.3, radius * sin(angle));
    vec3 lookAt = vec3(0.0, 0.3, 0.0);
    vec3 rd = getRayDir(gl_FragCoord.xy, vec2(800.0,600.0), ro, lookAt, 1.0);

    // array search setup
    int axis = dominantAxis(rd);
    int order = int(sign(rd[axis]));
    uint mindex = isubIndex(axis, order);
    uint maxdex = isubIndex(axis, -order);
    uint index = mindex;
    
    // raymarch
    float t = 0.0;
    float dist = 1.0;
    for (int i = 0; i < 128; i++) {
        vec3 p = ro + t * rd;
        if (index != clamp(index+1,mindex,maxdex)) break; //breaks if array limit has been reached
        while (length(p-points[isort[index]].xyz) > length(p-points[isort[clamp(index+1,mindex,maxdex)]].xyz)) { // goes as long as next point is closer to ray than the last one
            index += order;
        }
        float d = get_sdf(p, index);
        if (d < 0.1) {
            FragColor = vec4(vec3(0.6,1.1,1.1)-vec3(t/6.0),1.0);
            break;
        }
        t += d;
        if (t > 80.0) break;
    }
}