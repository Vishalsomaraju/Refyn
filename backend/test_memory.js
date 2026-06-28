import dotenv from 'dotenv';
dotenv.config();
import { saveMemory, loadMemory } from './services/memoryService.js';

async function runTest() {
  // Save a test pattern
  await saveMemory('vishal', {
    score: 72,
    issues: [{ category: 'performance', title: 'Inefficient loop' }]
  }, 'python');

  // Wait a second then recall
  await new Promise(r => setTimeout(r, 1500));

  const { memories } = await loadMemory('vishal');
  console.log('MEMORIES:', memories);
}

runTest();
