// Author: SEAL.C
// Title: W1

#ifdef GL_ES
precision mediump float;
#extension GL_OES_standard_derivatives : enable
#define PI 3.1415926
#endif

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;
uniform sampler2D u_tex0;

// ===== Methods =====
mat2 rot2(float a) {
    float c = cos(a), s = sin(a);
    return mat2(c, -s, s, c);
}

float stripeHatch(vec2 p, float angle, float freq, float fill) {
    float t = 1.0 - fill;
    p = rot2(angle) * p;
    float s = sin(p.y * freq * PI * 2.);
    float aa = fwidth(s) * 1.;
    return smoothstep(-aa, aa, s - mix(-1.5, .5, t));
}

float crossHatch(vec2 p, float freq, float fill) {
    float a1 = stripeHatch(p, PI / (cos(p.x) * sin(p.y)) / 10., freq, fill);
    float a2 = stripeHatch(p, PI / (cos(p.y) * sin(p.x)) / 20., freq, fill);
    return min(a1, a2);
}

float dotsHatch(vec2 p, float freq, float fill) {
    vec2 cell = p * freq;
    vec2 gv = fract(cell) - 0.5;
    float d = length(gv);
    float r = mix(0.5, 0.65, fill);
    float aa = fwidth(d) * 1.5;
    float m = smoothstep(r + aa, r - aa, d);
    return m;
}

// ===== Main =====
void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;

    vec3 t = texture2D(u_tex0, uv).rgb;
    float eps = 1e-6;
    float shading = exp((log(max(t.r, eps)) + log(max(t.g, eps)) + log(max(t.b, eps))) / 3.0);

    float scale = .25;
    vec2 P = (uv - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0) * scale;
    float stepv = 1.0 / 6.0;
    vec4 c;

    if(shading <= stepv) {
        float t = shading / stepv;
        // stripe lg -> md
        float a = stripeHatch(P, radians(15.0), 15.0, 0.85);
        float b = stripeHatch(P, radians(15.0), 22.0, 0.70);
        c = vec4(mix(a, b, t));
    } else if(shading <= 2.0 * stepv) {
        float t = (shading - stepv) / stepv;
        // stripe md -> sm
        float a = stripeHatch(P, radians(25.0), 28.0, 0.60);
        float b = stripeHatch(P, radians(25.0), 38.0, 0.50);
        c = vec4(mix(a, b, t));
    } else if(shading <= 3.0 * stepv) {
        float t = (shading - 2.0 * stepv) / stepv;
        // stripe sm -> cross sm
        float a = stripeHatch(P, (sin(P.x) + cos(P.y)) * PI, 45.0, 0.45);
        float b = 1.0 - crossHatch(P, 24.0, 0.35);
        c = vec4(mix(a, b, t));
    } else if(shading <= 4.0 * stepv) {
        float t = (shading - 3.0 * stepv) / stepv;
        // cross sm -> md
        float a = 1.0 - crossHatch(P, 28.0, 0.45);
        float b = 1.0 - crossHatch(P, 36.0, 0.55);
        c = vec4(mix(a, b, t));
    } else if(shading <= 5.0 * stepv) {
        float t = (shading - 4.0 * stepv) / stepv;
        // cross md -> dots sm
        float a = 1.0 - crossHatch(P, 98.0, 0.60);
        float b = 1.0 - dotsHatch(P, 18.0, 0.35);
        c = vec4(mix(mix(a, b, b), b, t));
    } else {
        float t = (shading - 5.0 * stepv) / stepv;
        // dots sm -> md
        float a = 1.0 - dotsHatch(P, 22.0, 0.25);
        float b = 1.0;
        c = vec4(mix(a, b, t));
    }

    vec4 inkColorX = vec4(0.0, 1.0, 0.84, 1.0);
    vec4 inkColorY = vec4(0.67, 0.55, 0.15, 1.0);
    vec4 src = mix(mix(inkColorX, inkColorY, c.r), inkColorY, 0.2);
    gl_FragColor = src;
}
