# Direct MITM 方案

仅凭 MITM 脚本使用的方案。所有的逻辑都通过脚本实现。

## 本地构建

每种代理工具对应 `mitm/targets/` 下的一个目录。构建完成后，可导入的脚本出现在 `mitm/dist/` 里。

```bash
zig build mitm
# 或
node scripts/build-mitm.js           # 构建全部
node scripts/build-mitm.js <target>  # 只构建指定 target
```
