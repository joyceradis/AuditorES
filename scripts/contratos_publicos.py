"""Renderiza o módulo público de contratos e organizações sociais."""

from html import escape
from math import isfinite
from urllib.parse import urlsplit


ESTADOS = {
    "em-preparacao": (
        "Em preparação",
        "Ops, esta seção ainda está em construção",
        "Ainda não há registros de contratos revisados para publicação.",
    ),
    "inventario-em-preparacao": (
        "Inventário em preparação",
        "Ops, esta seção ainda está em construção",
        "O inventário de contratos e documentos de execução ainda está sendo preparado.",
    ),
    "validacao-documental": (
        "Validação documental",
        "Documentos em conferência",
        "A publicação depende da conferência dos instrumentos contratuais e das evidências de execução.",
    ),
}

REGRA_PUBLICACAO = (
    "Um registro entra no painel depois da conferência do contrato e dos aditivos oficiais, da unidade, "
    "da vigência e da obrigação prevista. Qualquer resultado de execução precisa de evidência "
    "documentada para a competência informada."
)


def _texto(value):
    return value.strip() if isinstance(value, str) else ""


def _fonte_validada(fonte):
    if not isinstance(fonte, dict):
        return None
    titulo = _texto(fonte.get("titulo"))
    url = _texto(fonte.get("url"))
    if not titulo or not url or any(ord(c) < 33 for c in url):
        return None
    try:
        destino = urlsplit(url)
    except ValueError:
        return None
    if destino.scheme != "https" or not destino.hostname or destino.username is not None:
        return None
    return titulo, url


def _render_link(fonte, classe=""):
    if fonte is None:
        return ""
    titulo, url = fonte
    atributo_classe = f' class="{classe}"' if classe else ""
    return (
        f'<a{atributo_classe} href="{escape(url, quote=True)}">'
        f'{escape(titulo)} <span aria-hidden="true">↗</span></a>'
    )


def _valor_documental(value):
    if isinstance(value, str):
        return value.strip()
    if type(value) is int or (type(value) is float and isfinite(value)):
        return str(value)
    return ""


def _registros_validados(registros):
    if registros is None:
        return []
    if not isinstance(registros, list):
        raise ValueError("A configuração de contratos precisa trazer uma lista de registros.")

    campos = ("obrigacao", "previsto", "comprovado", "situacao")
    linhas = []
    for numero, registro in enumerate(registros, start=1):
        if not isinstance(registro, dict):
            raise ValueError(f"Registro contratual {numero} precisa ser um objeto.")
        linha = {campo: _valor_documental(registro.get(campo)) for campo in campos}
        fonte = _fonte_validada(registro.get("fonte"))
        if not all(linha.values()) or fonte is None:
            raise ValueError(f"Registro contratual {numero} incompleto ou sem fonte HTTPS válida.")
        linha["fonte"] = fonte
        linha["detalhes"] = [
            (rotulo, _texto(registro.get(chave)))
            for chave, rotulo in (("instrumento", "Instrumento"), ("unidade", "Unidade"), ("competencia", "Competência"))
            if _texto(registro.get(chave))
        ]
        linhas.append(linha)
    return linhas


def _render_roteiro_pasp(unidade):
    return f"""
  <section class="contratos-followup" aria-labelledby="plataforma">
    <h3 id="plataforma">Roteiro de conferência</h3>
    <p>Cada etapa precisa de registro documental para passar à próxima.</p>
    <ol class="contratos-checklist">
      <li>
        <p class="contratos-step-label">Unidade</p>
        <h4>{escape(unidade)}</h4>
        <p>Unidade de referência para localizar os instrumentos de gestão e de prestação de contas.</p>
      </li>
      <li>
        <p class="contratos-step-label">Contrato</p>
        <h4>A confirmar</h4>
        <p>Localizar contrato e aditivos oficiais e conferir a vigência, as obrigações e eventual vínculo com uma OS.</p>
      </li>
      <li>
        <p class="contratos-step-label">Competência</p>
        <h4>A confirmar</h4>
        <p>Definir o período da análise a partir da vigência e dos documentos de execução.</p>
      </li>
    </ol>
  </section>
"""


def _render_linha(linha):
    detalhes = ""
    if linha["detalhes"]:
        termos = "".join(
            f"<div><dt>{rotulo}</dt><dd>{escape(valor)}</dd></div>"
            for rotulo, valor in linha["detalhes"]
        )
        detalhes = f'<dl class="contratos-row-details">{termos}</dl>'
    return f"""
          <tr>
            <th scope="row">{escape(linha['obrigacao'])}{detalhes}</th>
            <td>{escape(linha['previsto'])}</td>
            <td>{escape(linha['comprovado'])}</td>
            <td>{_render_link(linha['fonte'])}</td>
            <td>{escape(linha['situacao'])}</td>
          </tr>"""


def _render_matriz(registros):
    if registros:
        descricao = "Obrigações, execução documentada e evidências por registro revisado."
        legenda = "Registros contratuais com conferência documental"
        linhas = "".join(_render_linha(linha) for linha in registros)
    else:
        descricao = "A matriz será preenchida após a conferência do contrato e da prestação de contas da competência analisada."
        legenda = "Estrutura da matriz de execução, ainda sem registros conferidos"
        linhas = """
          <tr>
            <th scope="row">A identificar no contrato</th>
            <td>Pendente</td>
            <td>Pendente</td>
            <td>Documento a vincular</td>
            <td><span class="tag context">Em conferência</span></td>
          </tr>"""
    return f"""
  <section class="contratos-followup" aria-labelledby="impacto">
    <h3 id="impacto">Matriz de execução</h3>
    <p>{descricao}</p>
    <div class="contratos-table-scroll" role="region" aria-labelledby="impacto" tabindex="0">
      <table>
        <caption class="sr-only">{legenda}</caption>
        <thead>
          <tr><th scope="col">Obrigação</th><th scope="col">Previsto</th><th scope="col">Comprovado</th><th scope="col">Evidência</th><th scope="col">Situação</th></tr>
        </thead>
        <tbody>{linhas}
        </tbody>
      </table>
    </div>
  </section>"""


def render_contratos(city, configuration=None):
    """Gera o HTML da seção de contratos para um município."""
    config = configuration or {}
    estado = _texto(config.get("estado"))
    rotulo, titulo, pendencia_padrao = ESTADOS.get(estado, ESTADOS["em-preparacao"])
    unidade = _texto(config.get("unidade"))
    registros = _registros_validados(config.get("registros"))
    if registros:
        rotulo, titulo = "Conferência documental", "Registros publicados"
        pendencia_padrao = "A matriz contém os registros que já passaram por conferência documental."
    pendencia = _texto(config.get("pendencia")) or pendencia_padrao
    resumo = _texto(config.get("resumo")) or (
        f"Este espaço é destinado à análise dos contratos de saúde de {city['nome']} "
        "e dos documentos que comprovam a execução dos serviços."
    )
    pasp = city.get("slug") == "vitoria" and bool(unidade)
    pa_id = ' id="pa"' if pasp else ""
    escopo = unidade or "Escopo da análise"
    referencia = '<p class="contratos-step-label">Unidade de referência</p>' if unidade else ""
    roteiro = _render_roteiro_pasp(unidade) if pasp else ""
    fonte = _render_link(_fonte_validada(config.get("fonte")), "contratos-fonte")
    matriz = _render_matriz(registros) if pasp or registros else ""

    return f"""<section class="screen" id="screen-contratos" aria-labelledby="contratos">
  <header class="contratos-heading">
    <h2 id="contratos">Contratos e OS</h2>
    <p class="lead">Contratos de saúde, organizações sociais (OS) e os documentos que permitem conferir a execução dos serviços.</p>
  </header>
  <div class="contratos-layout">
    <section class="contratos-panel"{pa_id} aria-labelledby="escopo">
      {referencia}
      <h3 id="escopo">{escape(escopo)}</h3>
      <p>{escape(resumo)}</p>{fonte}
    </section>
    <section class="contratos-panel contratos-status" aria-labelledby="status">
      <p class="contratos-step-label">{escape(rotulo)}</p>
      <h3 id="status">{escape(titulo)}</h3>
      <p>{escape(pendencia)}</p>
      <div class="contratos-publication">
        <h4>Critério de publicação</h4>
        <p>{escape(REGRA_PUBLICACAO)}</p>
      </div>
    </section>
  </div>{roteiro}{matriz}
</section>"""
