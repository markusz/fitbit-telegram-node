'use strict';

const Actions = {
  LOG: 1,
  BUDGET: 2
};

const Responses = [
  {
    pattern: /^joghurt$/i,
    action: Actions.LOG,
    title: 'Joghurt'
  },
  {
    pattern: /^apfel$/i,
    action: Actions.LOG,
    title: 'Apfel'
  },
  {
    pattern: /^kaffee$/i,
    action: Actions.LOG,
    title: 'Kaffee'
  },
  {
    pattern: /^cappuccino/i,
    action: Actions.LOG,
    title: 'Cappuccino'
  },
  {
    pattern: /^joghurt (\d+) (\d+) (\d+)$/i,
    action: Actions.LOG,
    title: 'Joghurt with weights'
  }
];

module.exports = {
  Responses,
  Actions
};
