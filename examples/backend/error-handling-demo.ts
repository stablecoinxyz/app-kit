/**
 * SBC Kit Error Handling Demo
 * 
 * This example demonstrates the improved error decoding capabilities
 * of the SBC Kit, which can decode cryptic revert reasons into 
 * human-readable messages.
 */

import { decodeRevertReason, parseUserOperationError } from '../../packages/core/src/utils.js';

// Example 1: Decode your exact error
console.log('🔍 Error Decoding Demo\n');

const yourError = '0x08c379a00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000002645524332303a207472616e7366657220616d6f756e7420657863656564732062616c616e63650000000000000000000000000000000000000000000000000000';

console.log('Original cryptic error:');
console.log(yourError);
console.log('\nDecoded human-readable error:');
console.log('✅', decodeRevertReason(yourError));

// Example 2: Common revert reasons
console.log('\n📋 Common Error Types:\n');

const commonErrors = [
  {
    name: 'ERC20 Insufficient Balance',
    data: '0x08c379a00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000002645524332303a207472616e7366657220616d6f756e7420657863656564732062616c616e63650000000000000000000000000000000000000000000000000000'
  },
  {
    name: 'Arithmetic Overflow',
    data: '0x4e487b710000000000000000000000000000000000000000000000000000000000000011'
  },
  {
    name: 'Division by Zero',
    data: '0x4e487b710000000000000000000000000000000000000000000000000000000000000012'
  },
  {
    name: 'Array Out of Bounds',
    data: '0x4e487b710000000000000000000000000000000000000000000000000000000000000032'
  }
];

commonErrors.forEach(({ name, data }) => {
  console.log(`${name}:`);
  console.log(`  Raw: ${data.slice(0, 50)}...`);
  console.log(`  Decoded: "${decodeRevertReason(data)}"`);
  console.log('');
});

// Example 3: Full UserOperation error parsing
console.log('🚨 Full Error Parsing Example:\n');

const fullUserOpError = new Error(
  `UserOperation reverted during simulation with reason: ${yourError}. Details: Gas estimation failed: Validation error: Array must contain at least 2 element(s) at "params"`
);

console.log('Full error message with suggestions:');
console.log(parseUserOperationError(fullUserOpError));

console.log('\n💡 The SBC Kit now automatically decodes these errors for you!'); 