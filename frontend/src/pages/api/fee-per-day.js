import StatsApi from "../../libraries/explorer-wamp/stats";

export default async function (req, res) {
  try {
    const { fee } = await new StatsApi(req).getTotalFeePerDays(1);
    res.send({ totalFeeInYoctoNear: fee });
  } catch (error) {
    console.error(error);
    res.status(502).send(error);
  }
}
