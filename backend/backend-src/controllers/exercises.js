const { publicCatalog } = require("../data/exercises");
const {
  checkAnswer,
  validateAttempt,
  withBreakdown,
} = require("../services/exercises");
const storage = require("../models/exercises");

function createExerciseController({ model = storage } = {}) {
  const catalog = (_req, res) => res.json(publicCatalog());
  const check = (req, res) => {
    try {
      res.json(checkAnswer(req.body));
    } catch (error) {
      res.status(error.status || 500).json({ erro: error.message });
    }
  };
  const list = async (req, res) => {
    const page = Number(req.query.page || 0);
    if (!Number.isSafeInteger(page) || page < 0 || page > 10000)
      return res.status(400).json({ erro: "Página inválida." });
    if (req.isLocalDemo) return res.json({ attempts: [], hasMore: false });
    try {
      const { data, error } = await model.listAttempts(req, page);
      if (error) throw error;
      res.json({
        attempts: data.map(withBreakdown),
        hasMore: data.length === 50,
      });
    } catch {
      res.status(503).json({
        erro: "Não foi possível carregar seus treinos. Tente novamente.",
      });
    }
  };
  const save = async (req, res) => {
    let record;
    try {
      record = validateAttempt(req.body);
    } catch (error) {
      return res.status(400).json({ erro: error.message });
    }
    if (req.isLocalDemo)
      return res.status(503).json({
        erro: "Entre em uma conta para guardar o histórico de treinos.",
      });
    try {
      const { data, error } = await model.saveAttempt(req, record);
      if (error) throw error;
      res.json({ attempt: withBreakdown(data) });
    } catch {
      res.status(503).json({
        erro: "Não foi possível salvar este treino. Seu texto continua aqui; tente concluir novamente.",
      });
    }
  };
  return { catalog, check, list, save };
}

module.exports = { createExerciseController };
