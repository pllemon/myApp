/**
 * 健康模块彩色扁平图标（独立于账单类目图标）
 * - 与 utils/icons.js 的 FLAT 物理分离：类目选择器只从 FLAT 取图，永不出现健康图标。
 * - 64x64 网格、固定色、轻微圆角，风格与账单类目图标一致。
 * - key 为健康指标中文名，供 m-icon tone="health" 按 healthKey 取图。
 */
const HEALTH = {
  '概览': '<rect x="-26" y="8" width="13" height="18" rx="3" fill="#FFA94D"/><rect x="-7" y="-2" width="13" height="28" rx="3" fill="#51CF66"/><rect x="12" y="-14" width="13" height="40" rx="3" fill="#22B8CF"/><path d="M-26,28 h52" stroke="#364A66" stroke-width="3" stroke-linecap="round"/>',
  '身高': '<rect x="-9" y="-26" width="18" height="52" rx="4" fill="#FFD43B"/><path d="M-9,-16 h7 M-9,-6 h11 M-9,4 h7 M-9,14 h11" stroke="#FFA94D" stroke-width="2.5" stroke-linecap="round"/>',
  '体重': '<rect x="-24" y="-18" width="48" height="38" rx="6" fill="#51CF66"/><rect x="-17" y="-11" width="34" height="16" rx="3" fill="#F1F5F9"/><circle cx="0" cy="-3" r="4" fill="#FF6B6B"/><path d="M-24,20 h48" stroke="#364A66" stroke-width="3" stroke-linecap="round"/>',
  '血压': '<path d="M-24,-18 h20 v36 h-20 a6,6 0 0 1 -6,-6 v-24 a6,6 0 0 1 6,-6z" fill="#4DABF7"/><circle cx="10" cy="0" r="16" fill="#F1F5F9" stroke="#364A66" stroke-width="2"/><path d="M10,0 L10,-9 M10,0 L18,3" stroke="#FF6B6B" stroke-width="2.5" stroke-linecap="round"/><circle cx="10" cy="0" r="2" fill="#364A66"/>',
  '心率': '<path d="M0,22 C-20,9 -27,-2 -27,-12 C-27,-20 -21,-25 -13,-25 C-7,-25 0,-21 0,-14 C0,-21 7,-25 13,-25 C21,-25 27,-20 27,-12 C27,-2 20,9 0,22z" fill="#FF6B6B"/><path d="M-18,-3 h7 l4,-9 l6,16 l4,-7 h15" stroke="#FFFFFF" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  '血糖': '<rect x="-20" y="-24" width="40" height="42" rx="5" fill="#22B8CF"/><rect x="-14" y="-17" width="28" height="18" rx="3" fill="#F1F5F9"/><path d="M-8,-8 h16" stroke="#FF6B6B" stroke-width="3" stroke-linecap="round"/><path d="M0,4 q-9,12 -9,18 a9,9 0 0 0 18,0 q0,-6 -9,-18z" fill="#FF6B6B"/>',
  '血氧': '<rect x="-22" y="0" width="44" height="26" rx="6" fill="#22B8CF"/><rect x="-16" y="6" width="32" height="14" rx="3" fill="#F1F5F9"/><path d="M-9,13 h18" stroke="#FF6B6B" stroke-width="2.5" stroke-linecap="round"/><circle cx="-8" cy="-10" r="4" fill="#74C0FC"/><circle cx="2" cy="-20" r="5" fill="#4DABF7"/><circle cx="13" cy="-12" r="3" fill="#74C0FC"/>',
  '体温': '<path d="M-7,-24 h14 v30 a7,7 0 0 1 -14,0z" fill="#F1F5F9" stroke="#FF6B6B" stroke-width="2"/><path d="M0,10 v-30" stroke="#FF6B6B" stroke-width="4" stroke-linecap="round"/><circle cx="0" cy="13" r="6" fill="#FF6B6B"/><path d="M6,-20 h6 M6,-12 h6" stroke="#FFA94D" stroke-width="2" stroke-linecap="round"/>',
  '饮水': '<path d="M-15,-20 h30 l-4,40 a4,4 0 0 1 -4,4 h-14 a4,4 0 0 1 -4,-4z" fill="#E3F2FD" stroke="#4DABF7" stroke-width="2"/><path d="M-14,2 h28 l-2,18 a4,4 0 0 1 -4,4 h-16 a4,4 0 0 1 -4,-4z" fill="#74C0FC"/><path d="M-15,-20 h30" stroke="#4DABF7" stroke-width="3" stroke-linecap="round"/><path d="M-4,-12 v6 M4,-10 v6" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/>',
  '睡眠': '<path d="M10,-25 a22,22 0 1,0 13,34 a17,17 0 0,1 -13,-34z" fill="#9775FA"/><path d="M-18,-22 l2,5 l5,2 l-5,2 l-2,5 l-2,-5 l-5,-2 l5,-2z" fill="#FFD43B"/><circle cx="-8" cy="16" r="2.5" fill="#FFD43B"/>',
  '运动': '<rect x="-16" y="-5" width="32" height="10" rx="3" fill="#51CF66"/><rect x="-26" y="-15" width="10" height="30" rx="3" fill="#22B8CF"/><rect x="16" y="-15" width="10" height="30" rx="3" fill="#22B8CF"/><rect x="-21" y="-9" width="5" height="18" rx="2" fill="#4DABF7"/><rect x="16" y="-9" width="5" height="18" rx="2" fill="#4DABF7"/>',
  '尿酸': '<path d="M-12,-24 h24 v34 a12,12 0 0 1 -24,0z" fill="#F1F5F9" stroke="#22B8CF" stroke-width="2"/><path d="M-12,2 h24 v8 a12,12 0 0 1 -24,0z" fill="#FFD43B"/><circle cx="-3" cy="12" r="2.5" fill="#FFA94D"/><circle cx="5" cy="15" r="2" fill="#FFA94D"/><path d="M-16,-24 h32" stroke="#22B8CF" stroke-width="3" stroke-linecap="round"/>',
  '血脂': '<path d="M0,-26 C-11,-11 -17,-2 -17,8 A17,17 0 0 0 17,8 C17,-2 11,-11 0,-26z" fill="#FF6B6B"/><path d="M0,-3 C-7,5 -10,10 -10,14 A10,10 0 0 0 10,14 C10,10 7,5 0,-3z" fill="#FFA8A8"/>',
  '饮食': '<path d="M-23,-3 h46 a23,20 0 0 1 -46,0z" fill="#FFA94D"/><path d="M-25,-5 h50" stroke="#FFD43B" stroke-width="4" stroke-linecap="round"/><path d="M-12,-22 l7,15 M3,-24 l-3,17" stroke="#A68C6A" stroke-width="3" stroke-linecap="round"/>',
  '用药': '<rect x="-24" y="-10" width="48" height="20" rx="10" fill="#9775FA"/><path d="M0,-10 v20" stroke="#D0BFFF" stroke-width="3"/><circle cx="14" cy="16" r="8" fill="#FFD43B"/><path d="M9,16 h10" stroke="#FFA94D" stroke-width="2" stroke-linecap="round"/>',
  '看诊': '<circle cx="-12" cy="-22" r="4.5" fill="#FF6B6B"/><circle cx="12" cy="-22" r="4.5" fill="#FF6B6B"/><path d="M-12,-19 v6 a12,12 0 0 0 24,0 v-6" stroke="#4DABF7" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M0,-7 v20" stroke="#22B8CF" stroke-width="5" stroke-linecap="round"/><circle cx="0" cy="18" r="8" fill="#FFD43B"/><circle cx="0" cy="18" r="3.5" fill="#FFA94D"/>',
  '生理期': '<ellipse cx="0" cy="-15" rx="7" ry="11" fill="#F06595"/><ellipse cx="0" cy="15" rx="7" ry="11" fill="#F06595"/><ellipse cx="-15" cy="0" rx="11" ry="7" fill="#F06595"/><ellipse cx="15" cy="0" rx="11" ry="7" fill="#F06595"/><circle cx="0" cy="0" r="8" fill="#FFD43B"/>'
};

module.exports = { HEALTH: HEALTH };
