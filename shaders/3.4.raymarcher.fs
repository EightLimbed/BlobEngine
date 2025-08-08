#version 330 core
out vec4 FragColor;
  
uniform float iTime; // the time variable to animate from

#define NUM_POINTS 22

vec3 points[NUM_POINTS] = vec3[](

    vec3( 0.0, 1.0, 0.0),
    vec3( 0.1, 0.95, 0.0),
    vec3(-0.1, 0.95, 0.0),
    vec3( 0.05, 0.85, 0.0),
    vec3(-0.05, 0.85, 0.0),

    vec3( 0.0, 0.4, 0.0),
    vec3( 0.0, 0.1, 0.0),

    vec3(-0.2, 0.3, 0.0),
    vec3(-0.5, 0.3, 0.0),
    vec3(-0.8, 0.3, 0.0),

    vec3( 0.2, 0.3, 0.0),
    vec3( 0.5, 0.3, 0.0),
    vec3( 0.8, 0.3, 0.0),

    vec3(-0.1, -0.3, 0.0),
    vec3(-0.25, -0.6, 0.0),
    vec3(-0.3, -0.9, 0.0),

    vec3( 0.1, -0.3, 0.0),
    vec3( 0.25, -0.6, 0.0),
    vec3( 0.3, -0.9, 0.0),

    vec3(0.0, -0.1, 0.0),
    
    vec3(0.0, 2.0, 0.0),
    vec3(0.0, 1.9, 0.0)
);

//softmin meatball kernel
float softmin(float a, float b, float k) {
    return -log(exp(-k*a)+exp(-k*b))/k;
}

float get_sdf(vec3 p) {
    float sdf = 1e6;
    for (int i = 0; i < NUM_POINTS; i++) {
        //can use any base sdf shape
        //-0.1 represents radius
        float d = length(max(abs(p-points[i])-0.1,0.0));
        //length(p-points[i])-0.1;
        sdf = softmin(sdf,d,9.0); //9.0 represents pull tightness, could add optional tightness override value to points, for forcing higher detail in certain areas
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
    //animations to move points around
    points[20] = vec3(cos(iTime*2.0), 1.0, sin(iTime*2.0));
    points[21] = vec3(cos(iTime*2.0), 0.7, sin(iTime*2.0));
    points[7].y = cos((iTime+points[7].x)*5.0)*0.05+0.3;//arm wave
    points[8].y = cos((iTime+points[8].x)*5.0)*0.1+0.3;
    points[9].y = cos((iTime+points[9].x)*5.0)*0.15+0.3;
    points[10].y = cos((iTime+points[10].x)*5.0)*0.05+0.3;//arm wave
    points[11].y = cos((iTime+points[11].x)*5.0)*0.1+0.3;
    points[12].y = cos((iTime+points[12].x)*5.0)*0.15+0.3;
    
    for (int i = 0; i < NUM_POINTS; i++) {
        points[i].xz += sin((iTime+points[i].y)*5.0)*0.05;
    }
    //actual code
    float radius = 4.0;
    float angle = iTime * 0.6;
    vec3 ro = vec3(radius * cos(angle), 0.3, radius * sin(angle));
    vec3 lookAt = vec3(0.0, 0.3, 0.0);
    vec3 rd = getRayDir(gl_FragCoord.xy, vec2(800.0,600.0), ro, lookAt, 1.0);

    float t = 0.0;
    float dist = 1.0;
    bool hit = false;

    for (int i = 0; i < 128; i++) {
        vec3 p = ro + t * rd;
        float d = get_sdf(p);
        if (d < 0.001) {
            hit = true;
            break;
        }
        t += d;
        if (t > 40.0) break;
    }

    if (hit) {
        FragColor = vec4(vec3(0.7,1.2,1.2)-vec3(t/5.0),1.0);
    } else {
        FragColor = vec4(0.0);
    }
}