import * as path from 'path';
import * as dotenv from 'dotenv';

/**
 * 环境变量加载入口。
 *
 * 必须是一个独立模块：ES Module 的依赖先于导入方本体执行，
 * 若把 dotenv.config() 写在 accounts/index.ts 的模块体里，
 * 它依赖的 config 会先完成初始化，从而读不到 .env 中的值。
 */
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export default dotenv;
