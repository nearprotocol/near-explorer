import StatsApi from "../../libraries/explorer-wamp/stats";

export default async function (req, res) {
  try {
    const feeCountPerDay = await new StatsApi(req).getTotalFee(
      req.query.days || 1
    );
    const resp = feeCountPerDay.map((i) => ({
      dateTime: i.date,
      totalFeeInYoctoNear: i.fee,
    }));
    res.send(resp);
  } catch (error) {
    console.error(error);
    res.status(502).send(error);
  }
}
