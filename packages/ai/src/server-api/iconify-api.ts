export async function getIcons(iconNames: string[]) {
  const promises: Promise<any>[] = [];
  for (const iconName of iconNames) {
    const res = fetch(`https://api.unisvg.com/search?query=${iconName}&pretty=1&prefixes=`, {
      method: 'GET', 
      headers: { 'Content-Type': 'application/json' }, 
      mode:'cors',
    }).then(r=>{
      return r.json();
    });
    promises.push(res);
  }
  const results: string[] = [];
  await Promise.all(promises).then(arg=>{
    for (const { icons, collections } of arg) {
      for (const key of icons) {
        const prefix = key.split(':')[0];
        const license = collections[prefix].license.spdx;
        if (license === 'MIT') {
          results.push(key);
        }
      }
    }
  });
  return results;
}