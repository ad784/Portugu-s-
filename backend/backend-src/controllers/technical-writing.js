const material = require("../data/technical-writing");
const storage = require("../models/technical-writing");
const {
  VERSION,
  validateTechnicalInput,
  createTechnicalEvaluator,
} = require("../services/technical-writing");
const {
  fingerprint,
  readCache,
  writeCache,
  singleFlight,
} = require("../services/evaluation-cache");
const { acquireCorrection } = require("../middleware/correction-limits");

function createTechnicalController({
  apiKey,
  model = "openai/gpt-oss-120b",
  evaluate,
  repository = storage,
  acquire = acquireCorrection,
} = {}) {
  const generate = evaluate || createTechnicalEvaluator({ apiKey, model });
  const config = (_req, res) => res.json(material);
  const list = async (req, res) => {
    const page = Number(req.query.page || 0),
      mode = req.query.mode || "";
    if (
      !Number.isSafeInteger(page) ||
      page < 0 ||
      page > 10000 ||
      !["", "enade", "concurso"].includes(mode)
    )
      return res.status(400).json({ erro: "Filtro de histórico inválido." });
    if (req.isLocalDemo) return res.json({ records: [], hasMore: false });
    try {
      const { data, error } = await repository.list(req, page, mode);
      if (error) throw error;
      res.json({ records: data, hasMore: data.length === 30 });
    } catch {
      res
        .status(503)
        .json({
          erro: "Não foi possível carregar o histórico técnico. Tente novamente.",
        });
    }
  };
  const detail = async (req, res) => {
    if (
      !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(
        req.params.id || "",
      )
    )
      return res.status(400).json({ erro: "Avaliação inválida." });
    try {
      const { data, error } = await repository.findById(req, req.params.id);
      if (error) throw error;
      if (!data)
        return res
          .status(404)
          .json({ erro: "Esta avaliação não foi encontrada na sua conta." });
      res.json({ record: data, salvo: true });
    } catch {
      res
        .status(503)
        .json({
          erro: "Não foi possível abrir esta avaliação. Tente novamente.",
        });
    }
  };
  const correct = async (req, res) => {
    let input;
    try {
      input = validateTechnicalInput(req.body);
    } catch (error) {
      return res.status(400).json({ erro: error.message });
    }
    const hash = fingerprint([VERSION, req.supabaseUser.id, model, input]);
    try {
      const response = await singleFlight(hash, async () => {
        if (!req.isLocalDemo) {
          try {
            const saved = await repository.findByHash(req, hash);
            if (saved.data) return { record: saved.data, salvo: true };
          } catch {
            /* A persistence outage must not erase the draft or prevent cache reuse. */
          }
        }
        let result = readCache(hash)?.technicalResult;
        if (!result) {
          const release = await acquire(req);
          try {
            result = await generate(input);
          } finally {
            await release();
          }
          writeCache(hash, { technicalResult: result });
        }
        if (!req.isLocalDemo) {
          try {
            const saved = await repository.save(req, hash, input, result);
            if (saved.data && !saved.error)
              return { record: saved.data, salvo: true };
          } catch {
            /* The response remains reviewable and can be saved by retrying the same input. */
          }
        }
        return {
          record: {
            id: null,
            mode: input.mode,
            task_type: input.taskType,
            area: input.area,
            board: input.board,
            score: result.score,
            max_score: result.maxScore,
            reference_based: result.referenceBased,
            created_at: new Date().toISOString(),
            payload: input,
            result,
            evaluation_hash: hash,
          },
          salvo: false,
          aviso:
            "Sua avaliação está pronta, mas ainda não foi salva na conta. Mantenha esta página aberta e tente salvar novamente.",
        };
      });
      res.json(response);
    } catch (error) {
      if (error.retryAfterSeconds)
        res.set("Retry-After", String(error.retryAfterSeconds));
      res
        .status(error.status || 502)
        .json({
          erro:
            error.message ||
            "Não foi possível concluir a correção. Sua resposta foi mantida.",
          retryAfterSeconds: error.retryAfterSeconds || null,
        });
    }
  };
  return { config, list, detail, correct };
}
module.exports = { createTechnicalController };
