
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { sreAgent } from './agents/sre';
import { monitoringWorkflow } from './workflows/monitoring-workflow';

export const mastra = new Mastra({
  agents: { sreAgent },
  storage: new LibSQLStore({
    url: "file:./mastra.db",
  }),
  workflows: { monitoringWorkflow },
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
});
