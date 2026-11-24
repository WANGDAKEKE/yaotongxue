import path from 'node:path';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const modules=path.resolve(here,'../../official-mini-client/node_modules');
export default {
  root:here,
  resolve:{alias:{react:path.join(modules,'react'),'react-dom':path.join(modules,'react-dom')}},
  optimizeDeps:{include:['react','react-dom/client']},
  server:{host:'127.0.0.1',port:5181,strictPort:true,fs:{allow:[path.resolve(here,'../..')]}}
};
