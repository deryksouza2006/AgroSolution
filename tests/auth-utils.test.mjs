import assert from 'node:assert/strict';
import test from 'node:test';
import { AxiosError } from 'axios';
import { AppError, isUnauthorized, parseApiError, parseApiFieldErrors } from '../src/utils/errors.ts';
import { validateAuthForm } from '../src/utils/validation.ts';

const input = { name: 'Produtor', email: 'produtor@example.com', password: 'p'.repeat(8) };
function responseError(status, data) {
  return new AxiosError('Internal diagnostic', undefined, undefined, undefined, { status, data });
}

test('login accepts email whitespace and requires valid email and password length', () => {
  assert.deepEqual(validateAuthForm({ ...input, email: '  produtor@example.com  ' }, false, ''), {});
  for (const email of ['', 'produtor', 'produtor@', 'a b@example.com']) {
    assert.ok(validateAuthForm({ ...input, email }, false, '').email);
  }
  for (const length of [0, 7, 73]) {
    assert.ok(validateAuthForm({ ...input, password: 'x'.repeat(length) }, false, '').password);
  }
  for (const length of [8, 72]) {
    assert.equal(validateAuthForm({ ...input, password: 'x'.repeat(length) }, false, '').password, undefined);
  }
});

test('registration requires name and matching confirmation; login does not', () => {
  assert.deepEqual(validateAuthForm(input, true, input.password), {});
  const errors = validateAuthForm({ ...input, name: '   ' }, true, 'different');
  assert.ok(errors.name);
  assert.ok(errors.confirmPassword);
  assert.deepEqual(validateAuthForm({ ...input, name: '' }, false, ''), {});
});

test('error parser prioritizes ProblemDetail detail, then message, then fields', () => {
  assert.equal(parseApiError(responseError(400, { detail: 'E-mail já cadastrado.', message: 'Outra mensagem', fields: { email: 'Inválido' } })), 'E-mail já cadastrado.');
  assert.equal(parseApiError(responseError(400, { message: 'Verifique os dados.', fields: { email: 'Inválido' } })), 'Verifique os dados.');
  assert.equal(parseApiError(responseError(400, { fields: { name: 'Nome obrigatório.', password: ['Senha muito curta.'] } })), 'Nome obrigatório.\nSenha muito curta.');
});

test('network, server and unauthorized errors have readable fallbacks', () => {
  assert.match(parseApiError(new AxiosError('Network Error')), /conectar ao servidor/);
  assert.match(parseApiError(responseError(503, {})), /indisponível/);
  assert.match(parseApiError(responseError(401, {})), /não autorizado/);
  assert.equal(isUnauthorized(responseError(403, {})), true);
  assert.equal(isUnauthorized(responseError(500, {})), false);
  assert.equal(isUnauthorized(new Error('private diagnostic')), false);
});

test('raw payloads, diagnostics and malformed fields are never rendered', () => {
  for (const data of ['private raw response', '<html>server failure</html>', { stack: 'private stack', trace: 'private trace' }, { detail: 'java.lang.IllegalArgumentException: private diagnostic' }, { fields: { invalid: { nested: 'private data' } } }]) {
    const parsed = parseApiError(responseError(500, data));
    assert.doesNotMatch(parsed, /private|html|Exception/);
  }
  assert.doesNotMatch(parseApiError(new Error('private diagnostic')), /private/);
  assert.equal(parseApiError(new AppError('Configure a URL da API.')), 'Configure a URL da API.');
});

test('field parser extracts safe 400 validation messages without diagnostics', () => {
  assert.deepEqual(parseApiFieldErrors(responseError(400, { fields: {
    name: ['Nome obrigatório.', 'Use pelo menos 3 caracteres.'],
    city: 'Cidade obrigatória.',
    state: { trace: 'private diagnostic' },
    totalArea: 'java.lang.IllegalArgumentException: private diagnostic',
  } })), { name: 'Nome obrigatório.\nUse pelo menos 3 caracteres.', city: 'Cidade obrigatória.' });
  assert.deepEqual(parseApiFieldErrors(responseError(500, { fields: { name: 'private diagnostic' } })), {});
  assert.deepEqual(parseApiFieldErrors(new Error('private diagnostic')), {});
});
