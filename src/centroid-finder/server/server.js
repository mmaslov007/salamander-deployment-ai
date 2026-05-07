import express from 'express';
import router from './router/routes.js';
import cors from 'cors';
import path from 'path';

const app = express();
const PORT = 3000;

app.use(express.static('./public'));
app.use(cors()); // enables cross-origin requests (allow frontend to fetch from here)

app.use("/", router);

// serve CSV files in results directory
const RESULTS_DIR = path.resolve('./results');
app.use('/results', express.static(RESULTS_DIR));
// console.log('Serving results from:', path.resolve(process.env.RESULTS_DIR));

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});