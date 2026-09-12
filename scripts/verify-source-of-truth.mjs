import { execSync } from 'node:child_process';

function git(args) {
  try {
    return execSync(`git ${args}`, { encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

async function fetchProductionVersion() {
  try {
    const res = await fetch('https://go.smartvid.app/api/version');
    if (!res.ok) {
      return { error: `HTTP ${res.status}` };
    }
    const data = await res.json();
    return data;
  } catch (err) {
    return { error: err.message };
  }
}

function main() {
  const localHead = git('rev-parse HEAD');
  const originMain = git('rev-parse origin/main');

  console.log('LOCAL HEAD');
  console.log(localHead || 'unknown');
  console.log('');
  console.log('ORIGIN/MAIN');
  console.log(originMain || 'unknown');
  console.log('');

  fetchProductionVersion().then((prod) => {
    console.log('PRODUCTION SHA');
    console.log(prod.commit || 'unavailable');
    console.log('');

    const localEqualMain = localHead === originMain;
    const productionEqualMain = prod.commit === originMain;

    console.log('STATUS');

    if (localEqualMain && productionEqualMain) {
      console.log('PASS');
    } else {
      console.log('FAIL');
      if (!localEqualMain) {
        console.log(`- Local HEAD does not match origin/main: ${localHead} vs ${originMain}`);
      }
      if (!productionEqualMain) {
        console.log(`- Production does not match origin/main: ${prod.commit || 'unavailable'} vs ${originMain}`);
      }
      if (prod.error) {
        console.log(`- Production endpoint error: ${prod.error}`);
      }
    }
  });
}

main();
