const openId = "df1379ad44edaa95cf08f31f7c6c87c9";

const headers = {
  "Authorization": "Bearer 1234",
  "x-api-key": "1234"
};

async function main() {
  const resp1 = await fetch(`http://localhost:1357/api/active_signs?openId=${openId}`, {
    headers
  }).then(res => res.json());

  console.log(resp1)

  const sign = resp1.result?.[0];

  if (!sign) {
    console.log('没有找到签到');
    return;
  }

  const x = await fetch(`http://localhost:1357/api/sign_in?openId=${openId}&courseId=${sign.courseId}&signId=${sign.signId}`, {
    headers
  }).then(res => res.json());

  console.log(x);
}

main();
