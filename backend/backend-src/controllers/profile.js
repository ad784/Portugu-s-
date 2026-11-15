const model = require("../models/profile");
const { normalizeProfileName } = require("../validations/profile");

function createProfileController({ requireSupabaseUser }) {
  const exportProfile = async (req, res) => {
    res.set("Cache-Control", "no-store");
    if (req.isLocalDemo)
      return res.json({
        perfil: { email: req.supabaseUser.email },
        redacoes: [],
      });
    try {
      const profile = await model.readProfile(req);
      const receipt = await model.readReceipt(req);
      if (profile.error || receipt.error)
        throw new Error("Consulta indisponível");
      const events = [];
      for (let offset = 0; ; offset += 200) {
        const page = await model.listLegalEvents(req, offset);
        if (page.error) throw page.error;
        events.push(...page.data);
        if (page.data.length < 200) break;
      }
      const redacoes = [];
      for (let offset = 0; ; offset += 200) {
        const page = await model.listExportEssays(req, offset);
        if (page.error) throw page.error;
        redacoes.push(...page.data);
        if (page.data.length < 200) break;
      }
      res.json({
        exportadoEm: new Date().toISOString(),
        perfil: { ...profile.data, email: req.supabaseUser.email },
        aceite: receipt.data,
        eventosDePrivacidade: events,
        redacoes,
        fotos:
          "As referências de arquivos são privadas. Solicite uma cópia das imagens ao contato do site.",
      });
    } catch {
      res.status(503).json({
        erro: "Não foi possível exportar seus dados. Tente novamente ou solicite uma cópia pelo contato do site.",
      });
    }
  };
  const getProfile = async (req, res) => {
    if (req.isLocalDemo) {
      return res.json({
        perfil: { nome: "Estudante local", email: req.supabaseUser.email },
      });
    }

    const { data, error } = await model.readName(req);

    if (error) {
      console.error("Erro ao carregar perfil:", error.message);
      return res
        .status(500)
        .json({ erro: "Não foi possível carregar seu perfil." });
    }

    res.json({
      perfil: { nome: data?.nome || "", email: req.supabaseUser.email },
    });
  };
  const updateProfile = async (req, res) => {
    const nome = normalizeProfileName(req.body?.nome);
    if (!nome)
      return res
        .status(400)
        .json({ erro: "Informe seu nome para salvar o perfil." });
    if (req.isLocalDemo)
      return res.json({ perfil: { nome, email: req.supabaseUser.email } });

    const { error } = await model.saveName(req, nome);
    if (error) {
      console.error("Erro ao atualizar perfil:", error.message);
      return res
        .status(500)
        .json({ erro: "Não foi possível atualizar seu perfil." });
    }

    res.json({ perfil: { nome, email: req.supabaseUser.email } });
  };
  return { exportProfile, getProfile, updateProfile };
}

module.exports = { createProfileController };
