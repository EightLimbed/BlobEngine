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

float get_sdf(vec3 p) {
    float sdf = 1e6;
    for (int i = 0; i < 64; i++) {
        //can use any base sdf shape
        //-0.1 represents radius
        //float d = length(max(abs(p-points[i])-0.1,0.0));S
        float d = length(p-points[i].xyz)-0.1;
        sdf = softmin(sdf,d,points[i].w); //.w represents the inverse of the pull strength
        //possibly a hash table that corresponds one material value to both tightness, and procedural texture.
    }
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
    //actual code
    float radius = 5.0;
    float angle = iTime * 0.6;
    vec3 ro = vec3(radius * cos(angle), 0.3, radius * sin(angle));
    vec3 lookAt = vec3(0.0, 0.3, 0.0);
    vec3 rd = getRayDir(gl_FragCoord.xy, vec2(800.0,600.0), ro, lookAt, 1.0);

    float t = 0.0;
    float dist = 1.0;
    FragColor = vec4(0.2,0.2,0.2,1.0);
    for (int i = 0; i < 128; i++) {
        vec3 p = ro + t * rd;
        float d = get_sdf(p);
        if (d < 0.001) {
            FragColor = vec4(vec3(0.6,1.1,1.1)-vec3(t/4.0),1.0);
            break;
        }
        t += d;
        if (t > 40.0) break;
    }
}