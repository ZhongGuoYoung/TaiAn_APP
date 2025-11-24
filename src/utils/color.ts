// 获取一个随机的颜色
export function getRandomColor(opacity = 1) {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  // return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  // 返回#xxxxxx
  return `#${r.toString(16)}${g.toString(16)}${b.toString(16)}`;
}
