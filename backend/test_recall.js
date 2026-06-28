import dotenv from 'dotenv';
dotenv.config();
import { HindsightClient } from '@vectorize-io/hindsight-client';

async function test() {
  const client = new HindsightClient({
    baseUrl: "https://api.hindsight.vectorize.io",
    apiKey: process.env.HINDSIGHT_API_KEY
  });

  const res = await client.recall('default', 'code review patterns and issues for developer vishal');
  console.log(JSON.stringify(res, null, 2));
}

test();
