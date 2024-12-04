const { readFileSync } = require('fs');

function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR",
    { style: "currency", currency: "BRL",
      minimumFractionDigits: 2 }).format(valor/100);
}

function getPeca(pecas, apresentacao) {
  return pecas[apresentacao.id]
}

class ServicoCalculoFatura {

  constructor(repo) {
    this.repo = repo
  }

  calcularCredito(apre) {
    let creditos = 0;
    creditos += Math.max(apre.audiencia - 30, 0);
    if (this.repo.getPeca(apre).tipo === "comedia") 
      creditos += Math.floor(apre.audiencia / 5);
    return creditos;   
  }

  calcularTotalCreditos(apresentacoes) {
    let totalCreditos = 0;
    for (let apre of apresentacoes) {
      totalCreditos += this.calcularCredito(apre);
    }

    return totalCreditos;
  }

  calcularTotalApresentacao(apre) {
    let total = 0;
    switch(this.repo.getPeca(apre).tipo) {
      case "tragedia":
        total = 40000;
        if (apre.audiencia > 30) {
          total += 1000 * (apre.audiencia - 30);
        }
        break;
      case "comedia":
        total = 30000;
        if (apre.audiencia > 20) {
          total += 10000 + 500 * (apre.audiencia - 20);
        }
        total += 300 * apre.audiencia;
        break;
      default:
          throw new Error(`Peça desconhecia: ${this.repo.getPeca(apre).tipo}`);
    }
    return total
  }

  calcularTotalFatura(apresentacoes) {
    let totalFatura = 0;

    for (let apre of apresentacoes) {
      totalFatura += this.calcularTotalApresentacao(apre);
    }

    return totalFatura;
  }
}

class Repositorio {
  constructor() {
    this.pecas = JSON.parse(readFileSync('./pecas.json'));
  }

  getPeca(apre) {
    return this.pecas[apre.id];
  }
}

function gerarFaturaStr (fatura, calc) {
    let faturaStr = `Fatura ${fatura.cliente}\n`;
    for (let apre of fatura.apresentacoes) {
        faturaStr += `  ${calc.repo.getPeca(apre).nome}: ${formatarMoeda(calc.calcularTotalApresentacao(apre))} (${apre.audiencia} assentos)\n`;
    }
    faturaStr += `Valor total: ${formatarMoeda(calc.calcularTotalFatura(fatura.apresentacoes))}\n`;
    faturaStr += `Créditos acumulados: ${calc.calcularTotalCreditos(fatura.apresentacoes)} \n`;
    return faturaStr;
  }

function gerarFaturaHTML(fatura, calc) {
  let faturaHTML = `<html>\n<p> Fatura UFMG </p>\n<ul>\n`
  for (let apre of fatura.apresentacoes) {
    faturaHTML += `<li> ${calc.repo.getPeca(apre).nome}: ${formatarMoeda(calc.calcularTotalApresentacao(apre))} (${apre.audiencia} assentos) </li>\n`;
  }
  faturaHTML += "</ul>\n"
  faturaHTML += `<p> Valor total: ${formatarMoeda(calc.calcularTotalFatura(fatura.apresentacoes))} </p>\n`
  faturaHTML += `<p> Créditos acumulados: ${calc.calcularTotalCreditos(fatura.apresentacoes)} </p>\n`
  faturaHTML += "</html>\n"
  return faturaHTML
}

const faturas = JSON.parse(readFileSync('./faturas.json'));
const calc = new ServicoCalculoFatura(new Repositorio());
const faturaStr = gerarFaturaStr(faturas, calc);
// const faturaHTML = gerarFaturaHTML(faturas, calc);
console.log(faturaStr);
// console.log(faturaHTML);