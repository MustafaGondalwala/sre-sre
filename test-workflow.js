import { m as mastra } from './.mastra/output/mastra.mjs';

async function testWorkflow() {
  try {
    console.log('🚀 Starting monitoring workflow test...');
    
    // Get the workflow from the mastra instance
    const workflow = mastra.workflows.monitoringWorkflow;
    
    if (!workflow) {
      throw new Error('Workflow not found in mastra instance');
    }
    
    console.log('📋 Workflow found, executing...');
    const result = await workflow.execute({});
    
    console.log('✅ Workflow completed successfully!');
    console.log('📊 Final result:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ Workflow failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

testWorkflow();
