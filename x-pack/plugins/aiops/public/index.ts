/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { AiopsPlugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, Kibana Platform `plugin()` initializer.
export function plugin() {
  return new AiopsPlugin();
}

export type { ExplainLogRateSpikesProps } from './components/explain_log_rate_spikes';
export { ExplainLogRateSpikes, SingleEndpointStreamingDemo } from './shared_lazy_components';
export type { AiopsPluginSetup, AiopsPluginStart } from './types';
