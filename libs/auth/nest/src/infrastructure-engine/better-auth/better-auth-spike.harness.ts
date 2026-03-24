import { Inject, Injectable } from '@nestjs/common';
import { AUTH_APPLICATION_MODULE_OPTIONS } from '../../application/application.module-definition';
import type { ResolvedAuthApplicationModuleOptions } from '../../config';
import {
  AuthEngineCapabilityReport,
  AuthEnginePort,
} from '../../application/services/auth-engine.port';

export type BetterAuthSpikeFlowResult = {
  flow: string;
  status: 'ready' | 'blocked';
  notes: string;
};

@Injectable()
export class BetterAuthSpikeHarness {
  constructor(
    private readonly authEnginePort: AuthEnginePort,
    @Inject(AUTH_APPLICATION_MODULE_OPTIONS)
    private readonly options: ResolvedAuthApplicationModuleOptions,
  ) {}

  async collectProofMatrix(): Promise<{
    engine: AuthEngineCapabilityReport['engine'];
    proofHarnessEnabled: boolean;
    flows: BetterAuthSpikeFlowResult[];
  }> {
    const report = await this.authEnginePort.describeCapabilities();

    return {
      engine: report.engine,
      proofHarnessEnabled: this.options.spike.proofHarnessEnabled,
      flows: report.flows.map((flow) => ({
        flow: flow.flow,
        status: flow.status === 'supported' ? 'ready' : 'blocked',
        notes: flow.notes,
      })),
    };
  }
}
