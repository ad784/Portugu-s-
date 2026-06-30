require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

// 🔥 SERVIR FRONTEND
app.use(express.static(path.join(__dirname, "../frontend")));

// 🔥 ROTA PRINCIPAL
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// 🚀 ROTA DE CORREÇÃO COM GROQ
app.post("/corrigir", async (req, res) => {
  const { texto } = req.body;

  if (!texto) {
    return res.status(400).json({ erro: "Texto não enviado" });
  }

  try {
    const resposta = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", // ✅ Modelo atualizado
        messages: [
          {
            role: "user",
            content: `Corrija a redação no modelo ENEM.

Responda assim:

Nota: 0 a 1000

Competências:
1: ...
2: ...
3: ...
4: ...
5: ...

Erros:
- ...

Sugestões:
- ...

Redação:
${texto}`
          }
        ]
      })
    });

    const dados = await resposta.json();

    if (!dados.choices) {
      console.error("Erro Groq:", dados);
      return res.status(500).json({ erro: "Erro na API Groq" });
    }

    res.json({
      resultado: dados.choices[0].message.content
    });

  } catch (erro) {
    console.error("Erro servidor:", erro);
    res.status(500).json({ erro: "Erro ao corrigir" });
  }
});

// 🚀 INICIAR SERVIDOR
app.listen(3000, () => {
  console.log("Servidor rodando em http://localhost:3000");
});