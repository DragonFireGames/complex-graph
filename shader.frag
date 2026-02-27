#define tau 2.*pi
#define pi  3.14159265358979323
//#define tau 6.28318530717958647
#define e   2.71828182845904523
#define Infinity   3.4028237e38
#define Epsilon   1.175494e-38
#define h0 0.01

#ifdef GL_ES
precision highp float;
#endif


// Properties
float Re(vec2 z) {
  return z.x;
}
float Im(vec2 z) {
  return z.y;
}
float Arg(vec2 z) {
  return atan(z.y,z.x);
}
float Abs(vec2 z) {
  return sqrt(z.x*z.x+z.y*z.y);
}
// Single Functions
vec2 Inv(vec2 z) {
  return vec2(z.x,-z.y)/dot(z,z);
}
vec2 Mult_i(vec2 z) {
  return vec2(-z.y,z.x);
}
// Multiplication
vec2 Mult(vec2 z, vec2 w) {
  if (w.y == 0.0) return w.x * z;
  if (z.y == 0.0) return z.x * w;
  return vec2(z.x*w.x-z.y*w.y, z.y*w.x+z.x*w.y);
}
vec2 Div(vec2 z, vec2 w) {
  return Mult(z,Inv(w));
}
// Squaring
vec2 Square(vec2 z) {
  return vec2(z.x*z.x - z.y*z.y, 2.0*z.x*z.y);
}
vec2 Cube(vec2 z) {
  return vec2(z.x*z.x*z.x - 3.0*z.x*z.y*z.y, 3.0*z.x*z.x*z.y - z.y*z.y*z.y);
}
// Exponential Functions
vec2 Exp(vec2 z) {
  return exp(z.x)*vec2(cos(z.y),sin(z.y));
}
float Arg(vec2 z, float k) {
  return Arg(Mult(z,Exp(vec2(0,2.*pi*k)))) - 2.*pi*k;
}
vec2 Ln(vec2 z, float k) {
  return vec2(log(Abs(z)),Arg(z,k));
}
vec2 Log(vec2 w, vec2 z, float k) {
  return Div(Ln(z,k),Ln(w,k));
}
vec2 Pow(vec2 z, vec2 w, float k) {
  return Exp(Mult(w,Ln(z, k)));
}
vec2 Root(vec2 w, vec2 z, float k) {
  return Pow(z,Inv(w),k);
}
vec2 Sqrt(vec2 z, float k) {
  return Pow(z, vec2(0.5,0), k);
}
// Trig Functions
vec2 Sinh(vec2 z) {
  return (Exp(z)-Exp(-z))/2.0;
}
vec2 Sin(vec2 z) {
  return -Mult_i(Sinh(Mult_i(z)));
}
vec2 Cosh(vec2 z) {
  return (Exp(z)+Exp(-z))/2.0;
}
vec2 Cos(vec2 z) {
  return Cosh(Mult_i(z));
}
vec2 Tanh(vec2 z) {
  vec2 e2x = Exp(2.*z);
  return Div(e2x-vec2(1,0),e2x+vec2(1,0));
}
vec2 Tan(vec2 z) {
  return -Mult_i(Tanh(Mult_i(z)));
}
vec2 Coth(vec2 z) {
  return Inv(Tanh(z));
}
vec2 Cot(vec2 z) {
  return Inv(Tan(z));
}
vec2 Sech(vec2 z) {
  return Inv(Cosh(z));
}
vec2 Sec(vec2 z) {
  return Inv(Cos(z));
}
vec2 Csch(vec2 z) {
  return Inv(Sinh(z));
}
vec2 Csc(vec2 z) {
  return Inv(Sin(z));
}
// Inverse Trig
vec2 Arcsinh(vec2 z, float k) {
  return Ln(z+Sqrt(Square(z)+vec2(1,0),k),k*2.);
}
vec2 Arcsin(vec2 z, float k) {
  return -Mult_i(Arcsinh(Mult_i(z),k));
}
vec2 Arccosh(vec2 z, float k) {
  return Ln(z+Sqrt(Square(z)-vec2(1,0),k),k*2.);
}
vec2 Arccos(vec2 z, float k) {
  return -Mult_i(Arccosh(z,k));
}
vec2 Arctanh(vec2 z, float k) {
  return 0.5*Ln(Div(vec2(1,0)+z,vec2(1,0)-z),k);
}
vec2 Arctan(vec2 z, float k) {
  return -Mult_i(Arctanh(Mult_i(z),k));
}
vec2 Arccoth(vec2 z, float k) {
  return Arctanh(Inv(z),k);
}
vec2 Arccot(vec2 z, float k) {
  return Arctan(Inv(z),k);
}
vec2 Arcsech(vec2 z, float k) {
  return Arccosh(Inv(z),k);
}
vec2 Arcsec(vec2 z, float k) {
  return Arccos(Inv(z),k);
}
vec2 Arccsch(vec2 z, float k) {
  return Arcsinh(Inv(z),k);
}
vec2 Arccsc(vec2 z, float k) {
  return Arcsin(Inv(z),k);
}
// Misc
vec2 Gamma(vec2 z, float k) {
  vec2 prod = Inv(z);
  for (float n = 1.; n <= 20.; n += 1.) {
    prod = Mult(prod,Div(Pow(vec2(1.+1./n,0.),z,k),vec2(1.,0.)+z/n));
  }
  return prod;
}
vec2 Erf(vec2 z) {//, int k) {
  vec2 v = vec2(0);
  for (float i = 0.02; i < 1.; i+=0.04) {
    vec2 x = z*i;
    v += Exp(-1.*Square(x));
  }
  v = Mult(v,z)*0.04;
  return v*2./sqrt(pi);
}
vec2 Erfi(vec2 z) {//, int k) {
  return -Mult_i(Erf(Mult_i(z)));
}
// Function
#FUNCTION#
// Display
vec3 lerp(vec3 a, vec3 b, float t) {
  return a * (1. - t) + b * t;
}

vec3 hsv(float h, float s, float v) {
  // h range [0,2*pi] -> [0,1] 
  h /= 2.0*pi;
  // hsv to rgb
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(vec3(h) + K.xyz) * 6.0 - K.www);
  return v * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), s);
}
vec3 hsl(float h, float s, float l) {
  // HSL to HSV
  float v = l + s * min(l, 1.0 - l);
  s = 2.0 * (1.0 - (l / v));
  //HSV to RGB
  return hsv(h,s,v);
}

void Brightness(inout vec3 color, float m) {
  float a = 3.0 * log(m);
  //float a = 3.0 * fract(log(m))-1.5+log(m)*0.2;
  //float a = 3.0 * fract(log(m))-1.5;
  float white = 5.0 * a - 1.0;
  if (white > 0.0) {
    float t = 1.0 - pow(0.96,white);
    color = lerp(color,vec3(1.0),t);
    return;
  }
  float black = -5.0 * a - 1.0;
  if (black > 0.0) {
    float t = 1.0 - pow(0.96,black);
    color = lerp(color,vec3(0.0),t);
  }
}

float Light(float r) {
  float p = r*r;
  return p / (p + 1.0);
}
  
uniform float u_lines;
uniform float u_scale;
uniform vec2 u_resolution;
uniform float u_zoom;
uniform vec2 u_offset;
uniform vec2 u_mouse;
uniform float u_selection;

void main() {
  
  vec2 z = (gl_FragCoord.xy*2. - u_resolution)/u_scale;
  z.xy = z.xy*u_zoom + u_offset;
  
  // Circles
  vec2 ms = (u_mouse*2. - u_resolution)/u_scale;
  ms.y += 2.0;
  ms.xy = ms.xy*u_zoom + u_offset;
  
  float sel = u_selection; // #SELECTION#
  
  vec2 r = F(z,sel,ms);
  vec2 dr = #DEVAL#;
  
  //float d1 = Abs(ms-z);
  //if (d1 < 0.04*u_zoom) {r = z; dr = vec2(h0,0);}
  //else if (d1 < 0.05*u_zoom) r = vec2(0);
  
  float absR = Abs(r);
  float argR = Arg(r);
  
  // Color & brightness
  //vec3 color = hsl(argR + 2.0 * pi / 3.0, 1.0, Light(absR));
  
  vec3 color = hsv(argR + 2.0 * pi / 3.0, 1.0, 1.0);
  
  // Lines
  /*
  
  Brightness(color,absR);
  
  float c = 0.;
  
  float tolerance = 0.01/absR*u_zoom;

  c = fract(argR*6.0/pi+tolerance*0.5);
  //if (c < tolerance) color *= 0.5;
  if (c < tolerance) color *= length(vec3(1)-color);
  
  c = fract(log2(absR));
  //if (abs(c) < tolerance) color *= 0.5;
  if (abs(c) < tolerance) color *= length(vec3(1)-color);
  
  c = fract(argR*2.0/pi+tolerance*0.5);
  if (c < tolerance) color *= 0.3;
  
  if (abs(absR-1.) < tolerance) color *= 0.3;
  //*/
  //*
  
  float dmag = length(dr);
  float tolerance = dmag/absR*u_zoom;

  if (fract(argR*2.0/pi+tolerance*0.35) < tolerance*0.7 || abs(absR-1.) < tolerance*0.5) {
    color *= 0.6;
    Brightness(color,sqrt(absR));
    //Brightness(color,sqrt(sqrt(absR)));
  } else if (fract(argR*6.0/pi+tolerance*0.5) < tolerance || abs(fract(log2(absR))) < tolerance) {
    //vec3 old = color;
    //Brightness(color,absR);
    //float c = length(vec3(1)-color);
    //color = c*old;
    Brightness(color,sqrt(absR));
    //Brightness(color,sqrt(sqrt(absR)));
  } else {
    Brightness(color,absR);
  }
  //*/
  
  float d1 = Abs(ms-z);
  if (d1 < 0.025*u_zoom) color = vec3(0,0,1);
  if (d1 < 0.05*u_zoom) color = lerp(color,vec3(0,0,1),0.4);
  
  /*
  const int BOUNDS = 3;
  for (int k = -BOUNDS; k <= BOUNDS; k++) {
    vec2 res = F(ms,k+sel,ms);
    float d2 = Abs(res-z);
    if (d2 < 0.025*u_zoom) color = vec3(0.7,0,0.7);
    if (d2 < 0.05*u_zoom) color = lerp(color,vec3(0.7,0,0.7),0.4);
  }
  //*/
  
  /*
  vec2 res = F(ms,sel,ms);
  float d2 = Abs(res-z);
  if (d2 < 0.025*u_zoom) color = vec3(0,0.7,0);
  if (d2 < 0.05*u_zoom) color = lerp(color,vec3(0,0.7,0),0.4);
  //*/
  
  gl_FragColor = vec4(color,1.0); // R,G,B,A
}

