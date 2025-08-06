// ,
#ifdef GL_ES
precision mediump float;
#endif

attribute vec3 aPosition;

void main() {
  vec4 positionVec4 = vec4(aPosition, 1.0);

  gl_Position = positionVec4;
}
