import { f as diskUtilizationTool, h as memoryTool, n as networkTool, p as processTool, l as latencyTool, j as cpuTool } from './.mastra/output/mastra.mjs';

async function testTools() {
  try {
    console.log('🔍 Testing individual tools...\n');
    
    // Test disk tool
    console.log('📁 Testing disk tool...');
    const diskResult = await diskUtilizationTool.execute({ context: {} });
    console.log('Disk result:', JSON.stringify(diskResult, null, 2));
    console.log('');
    
    // Test memory tool
    console.log('🧠 Testing memory tool...');
    const memoryResult = await memoryTool.execute({ context: {} });
    console.log('Memory result:', JSON.stringify(memoryResult, null, 2));
    console.log('');
    
    // Test network tool
    console.log('🌐 Testing network tool...');
    const networkResult = await networkTool.execute({ context: {} });
    console.log('Network result:', JSON.stringify(networkResult, null, 2));
    console.log('');
    
    // Test process tool
    console.log('⚙️ Testing process tool...');
    const processResult = await processTool.execute({ context: {} });
    console.log('Process result:', JSON.stringify(processResult, null, 2));
    console.log('');
    
    // Test latency tool
    console.log('⏱️ Testing latency tool...');
    const latencyResult = await latencyTool.execute({ context: { url: 'https://httpbin.org/delay/1', attempts: 3, timeoutMs: 5000 } });
    console.log('Latency result:', JSON.stringify(latencyResult, null, 2));
    console.log('');
    
    // Test CPU tool
    console.log('🖥️ Testing CPU tool...');
    const cpuResult = await cpuTool.execute({ context: {} });
    console.log('CPU result:', JSON.stringify(cpuResult, null, 2));
    console.log('');
    
  } catch (error) {
    console.error('❌ Error testing tools:', error);
    console.error('Stack trace:', error.stack);
  }
}

testTools();
