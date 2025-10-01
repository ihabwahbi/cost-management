/**
 * Cell Validator CLI
 */

import { Command } from 'commander';
import { validateCell } from './validator.js';
import { resolve } from 'path';

const program = new Command();

program
  .name('cell-validator')
  .description('Validate Component Cell structure and configuration')
  .version('0.1.0');

program
  .command('validate')
  .description('Validate a Component Cell')
  .argument('<cell-path>', 'Path to the Cell directory')
  .action(async (cellPath: string) => {
    console.log(`\n🔍 Validating Cell: ${cellPath}\n`);

    const absolutePath = resolve(process.cwd(), cellPath);
    const result = await validateCell(absolutePath);

    // Print errors
    if (result.errors.length > 0) {
      console.log('❌ Errors:\n');
      result.errors.forEach((error) => {
        console.log(`  • ${error}`);
      });
      console.log('');
    }

    // Print warnings
    if (result.warnings.length > 0) {
      console.log('⚠️  Warnings:\n');
      result.warnings.forEach((warning) => {
        console.log(`  • ${warning}`);
      });
      console.log('');
    }

    // Print result
    if (result.valid) {
      console.log('✅ Cell validation passed!\n');
      process.exit(0);
    } else {
      console.log(`❌ Cell validation failed with ${result.errors.length} error(s)\n`);
      process.exit(1);
    }
  });

// Future command: validate all cells
program
  .command('validate-all')
  .description('Validate all Cells in the project (future implementation)')
  .action(() => {
    console.log('⚠️  validate-all command not yet implemented');
    console.log('This will be available in a future version');
    process.exit(1);
  });

export { program };
