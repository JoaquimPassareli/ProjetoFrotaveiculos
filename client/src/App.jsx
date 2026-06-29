import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "frota_veiculos_v1";

const dadosVazios = {
	veiculos: [],
	abastecimentos: [],
	manutencoes: [],
};

function formatCurrency(value) {
	return Number(value || 0).toLocaleString("pt-BR", {
		style: "currency",
		currency: "BRL",
	});
}

function formatDate(dateString) {
	if (!dateString) return "-";
	const date = new Date(`${dateString}T00:00:00`);
	return date.toLocaleDateString("pt-BR");
}

function normalizarVeiculo(veiculo) {
	return {
		id: veiculo.id,
		placa: veiculo.placa ?? veiculo.plate ?? "",
		modelo: veiculo.modelo ?? veiculo.model ?? "",
		quilometragem: Number(veiculo.quilometragem ?? veiculo.mileage ?? 0),
	};
}

function normalizarAbastecimento(abastecimento) {
	return {
		id: abastecimento.id,
		veiculoId: abastecimento.veiculoId ?? abastecimento.vehicleId ?? "",
		data: abastecimento.data ?? abastecimento.date ?? "",
		litros: Number(abastecimento.litros ?? abastecimento.liters ?? 0),
		valor: Number(abastecimento.valor ?? abastecimento.value ?? 0),
		quilometragem: Number(
			abastecimento.quilometragem ?? abastecimento.mileage ?? 0,
		),
	};
}

function normalizarManutencao(manutencao) {
	return {
		id: manutencao.id,
		veiculoId: manutencao.veiculoId ?? manutencao.vehicleId ?? "",
		data: manutencao.data ?? manutencao.date ?? "",
		descricao: manutencao.descricao ?? manutencao.description ?? "",
		valor: Number(manutencao.valor ?? manutencao.value ?? 0),
		quilometragem: Number(manutencao.quilometragem ?? manutencao.mileage ?? 0),
	};
}

function readStorage() {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return dadosVazios;
		const parsed = JSON.parse(raw);

		const veiculosBrutos = Array.isArray(parsed.veiculos)
			? parsed.veiculos
			: Array.isArray(parsed.vehicles)
				? parsed.vehicles
				: [];

		const abastecimentosBrutos = Array.isArray(parsed.abastecimentos)
			? parsed.abastecimentos
			: Array.isArray(parsed.fuelings)
				? parsed.fuelings
				: [];

		const manutencoesBrutas = Array.isArray(parsed.manutencoes)
			? parsed.manutencoes
			: Array.isArray(parsed.maintenances)
				? parsed.maintenances
				: [];

		return {
			veiculos: veiculosBrutos.map(normalizarVeiculo),
			abastecimentos: abastecimentosBrutos.map(normalizarAbastecimento),
			manutencoes: manutencoesBrutas.map(normalizarManutencao),
		};
	} catch {
		return dadosVazios;
	}
}

export default function App() {
	const [dados, setDados] = useState(readStorage);
	const [statusApi, setStatusApi] = useState("Carregando...");
	const [veiculoSelecionadoId, setVeiculoSelecionadoId] = useState("");
	const [filtroTipoGasto, setFiltroTipoGasto] = useState("todos");
	const [filtroVeiculoGasto, setFiltroVeiculoGasto] = useState("todos");
	const [periodoInicio, setPeriodoInicio] = useState("");
	const [periodoFim, setPeriodoFim] = useState("");
	const [edicaoAbastecimentoId, setEdicaoAbastecimentoId] = useState("");
	const [edicaoManutencaoId, setEdicaoManutencaoId] = useState("");

	const [formularioVeiculo, setFormularioVeiculo] = useState({
		placa: "",
		modelo: "",
		quilometragem: "",
	});

	const [formularioAbastecimento, setFormularioAbastecimento] = useState({
		veiculoId: "",
		data: "",
		litros: "",
		valor: "",
		quilometragem: "",
	});

	const [formularioManutencao, setFormularioManutencao] = useState({
		veiculoId: "",
		data: "",
		descricao: "",
		valor: "",
		quilometragem: "",
	});

	useEffect(() => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
	}, [dados]);

	useEffect(() => {
		fetch("http://localhost:4000/api/ping")
			.then((res) => res.json())
			.then(() => setStatusApi("Online"))
			.catch(() =>
				setStatusApi("Offline (backend opcional para armazenamento local)"),
			);
	}, []);

	useEffect(() => {
		if (!veiculoSelecionadoId && dados.veiculos.length > 0) {
			setVeiculoSelecionadoId(dados.veiculos[0].id);
		}
	}, [dados.veiculos, veiculoSelecionadoId]);

	const veiculoSelecionado = useMemo(
		() => dados.veiculos.find((veiculo) => veiculo.id === veiculoSelecionadoId),
		[dados.veiculos, veiculoSelecionadoId],
	);

	const abastecimentosSelecionados = useMemo(
		() =>
			dados.abastecimentos.filter(
				(item) => item.veiculoId === veiculoSelecionadoId,
			),
		[dados.abastecimentos, veiculoSelecionadoId],
	);

	const manutencoesSelecionadas = useMemo(
		() =>
			dados.manutencoes.filter(
				(item) => item.veiculoId === veiculoSelecionadoId,
			),
		[dados.manutencoes, veiculoSelecionadoId],
	);

	const ultimoAbastecimento = useMemo(() => {
		return [...abastecimentosSelecionados].sort(
			(a, b) => new Date(b.data) - new Date(a.data),
		)[0];
	}, [abastecimentosSelecionados]);

	const ultimaManutencao = useMemo(() => {
		return [...manutencoesSelecionadas].sort(
			(a, b) => new Date(b.data) - new Date(a.data),
		)[0];
	}, [manutencoesSelecionadas]);

	const quilometragemAtual = useMemo(() => {
		if (!veiculoSelecionado) return 0;

		const quilometragens = [
			Number(veiculoSelecionado.quilometragem || 0),
			...abastecimentosSelecionados.map((item) =>
				Number(item.quilometragem || 0),
			),
			...manutencoesSelecionadas.map((item) => Number(item.quilometragem || 0)),
		];

		return Math.max(...quilometragens);
	}, [veiculoSelecionado, abastecimentosSelecionados, manutencoesSelecionadas]);

	const totais = useMemo(() => {
		const abastecimentosFiltrados =
			filtroVeiculoGasto === "todos"
				? dados.abastecimentos
				: dados.abastecimentos.filter(
						(item) => item.veiculoId === filtroVeiculoGasto,
					);

		const manutencoesFiltradas =
			filtroVeiculoGasto === "todos"
				? dados.manutencoes
				: dados.manutencoes.filter(
						(item) => item.veiculoId === filtroVeiculoGasto,
					);

		const inicio = periodoInicio
			? new Date(`${periodoInicio}T00:00:00`).getTime()
			: null;
		const fim = periodoFim
			? new Date(`${periodoFim}T23:59:59`).getTime()
			: null;

		const estaNoPeriodo = (dataItem) => {
			if (!inicio && !fim) return true;
			const data = new Date(`${dataItem}T12:00:00`).getTime();
			if (Number.isNaN(data)) return false;
			if (inicio && data < inicio) return false;
			if (fim && data > fim) return false;
			return true;
		};

		const abastecimentosNoPeriodo = abastecimentosFiltrados.filter((item) =>
			estaNoPeriodo(item.data),
		);

		const manutencoesNoPeriodo = manutencoesFiltradas.filter((item) =>
			estaNoPeriodo(item.data),
		);

		const totalAbastecimentos = abastecimentosNoPeriodo.reduce(
			(sum, item) => sum + Number(item.valor || 0),
			0,
		);
		const totalManutencoes = manutencoesNoPeriodo.reduce(
			(sum, item) => sum + Number(item.valor || 0),
			0,
		);

		return {
			totalAbastecimentos,
			totalManutencoes,
			totalGeral: totalAbastecimentos + totalManutencoes,
		};
	}, [
		dados.abastecimentos,
		dados.manutencoes,
		filtroVeiculoGasto,
		periodoInicio,
		periodoFim,
	]);

	const totalFiltrado =
		filtroTipoGasto === "abastecimento"
			? totais.totalAbastecimentos
			: filtroTipoGasto === "manutencao"
				? totais.totalManutencoes
				: totais.totalGeral;

	function limparFormularioAbastecimento() {
		setFormularioAbastecimento({
			veiculoId: "",
			data: "",
			litros: "",
			valor: "",
			quilometragem: "",
		});
		setEdicaoAbastecimentoId("");
	}

	function limparFormularioManutencao() {
		setFormularioManutencao({
			veiculoId: "",
			data: "",
			descricao: "",
			valor: "",
			quilometragem: "",
		});
		setEdicaoManutencaoId("");
	}

	function addVehicle(event) {
		event.preventDefault();

		if (!formularioVeiculo.placa || !formularioVeiculo.modelo) return;

		const veiculo = {
			id: crypto.randomUUID(),
			placa: formularioVeiculo.placa.toUpperCase(),
			modelo: formularioVeiculo.modelo,
			quilometragem: Number(formularioVeiculo.quilometragem || 0),
		};

		setDados((prev) => ({ ...prev, veiculos: [...prev.veiculos, veiculo] }));
		setFormularioVeiculo({ placa: "", modelo: "", quilometragem: "" });
		setVeiculoSelecionadoId(veiculo.id);
	}

	function salvarAbastecimento(event) {
		event.preventDefault();

		if (
			!formularioAbastecimento.veiculoId ||
			!formularioAbastecimento.data ||
			!formularioAbastecimento.valor
		)
			return;

		const abastecimento = {
			id: edicaoAbastecimentoId || crypto.randomUUID(),
			veiculoId: formularioAbastecimento.veiculoId,
			data: formularioAbastecimento.data,
			litros: Number(formularioAbastecimento.litros || 0),
			valor: Number(formularioAbastecimento.valor || 0),
			quilometragem: Number(formularioAbastecimento.quilometragem || 0),
		};

		setDados((prev) => {
			const abastecimentosAtualizados = edicaoAbastecimentoId
				? prev.abastecimentos.map((item) =>
						item.id === edicaoAbastecimentoId ? abastecimento : item,
					)
				: [...prev.abastecimentos, abastecimento];

			return {
				...prev,
				abastecimentos: abastecimentosAtualizados,
			};
		});

		limparFormularioAbastecimento();
	}

	function salvarManutencao(event) {
		event.preventDefault();

		if (
			!formularioManutencao.veiculoId ||
			!formularioManutencao.data ||
			!formularioManutencao.descricao ||
			!formularioManutencao.valor
		) {
			return;
		}

		const manutencao = {
			id: edicaoManutencaoId || crypto.randomUUID(),
			veiculoId: formularioManutencao.veiculoId,
			data: formularioManutencao.data,
			descricao: formularioManutencao.descricao,
			valor: Number(formularioManutencao.valor || 0),
			quilometragem: Number(formularioManutencao.quilometragem || 0),
		};

		setDados((prev) => {
			const manutencoesAtualizadas = edicaoManutencaoId
				? prev.manutencoes.map((item) =>
						item.id === edicaoManutencaoId ? manutencao : item,
					)
				: [...prev.manutencoes, manutencao];

			return {
				...prev,
				manutencoes: manutencoesAtualizadas,
			};
		});

		limparFormularioManutencao();
	}

	function editarAbastecimento(item) {
		setEdicaoAbastecimentoId(item.id);
		setFormularioAbastecimento({
			veiculoId: item.veiculoId,
			data: item.data,
			litros: String(item.litros ?? ""),
			valor: String(item.valor ?? ""),
			quilometragem: String(item.quilometragem ?? ""),
		});
	}

	function editarManutencao(item) {
		setEdicaoManutencaoId(item.id);
		setFormularioManutencao({
			veiculoId: item.veiculoId,
			data: item.data,
			descricao: item.descricao,
			valor: String(item.valor ?? ""),
			quilometragem: String(item.quilometragem ?? ""),
		});
	}

	function excluirAbastecimento(id) {
		const confirma = window.confirm(
			"Deseja realmente excluir este abastecimento?",
		);
		if (!confirma) return;

		setDados((prev) => ({
			...prev,
			abastecimentos: prev.abastecimentos.filter((item) => item.id !== id),
		}));

		if (edicaoAbastecimentoId === id) {
			limparFormularioAbastecimento();
		}
	}

	function excluirManutencao(id) {
		const confirma = window.confirm(
			"Deseja realmente excluir esta manutenção?",
		);
		if (!confirma) return;

		setDados((prev) => ({
			...prev,
			manutencoes: prev.manutencoes.filter((item) => item.id !== id),
		}));

		if (edicaoManutencaoId === id) {
			limparFormularioManutencao();
		}
	}

	function aplicarMesAtual() {
		const hoje = new Date();
		const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
		const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

		setPeriodoInicio(inicioMes.toISOString().slice(0, 10));
		setPeriodoFim(fimMes.toISOString().slice(0, 10));
	}

	function limparPeriodo() {
		setPeriodoInicio("");
		setPeriodoFim("");
	}

	return (
		<div className="page">
			<header className="header">
				<h1>Controle de Manutenção da Frota</h1>
			</header>

			<main className="grid">
				<section className="card">
					<h2>Cadastrar Veículo</h2>
					<form onSubmit={addVehicle} className="form">
						<input
							type="text"
							placeholder="Placa"
							value={formularioVeiculo.placa}
							onChange={(e) =>
								setFormularioVeiculo((prev) => ({
									...prev,
									placa: e.target.value,
								}))
							}
							required
						/>
						<input
							type="text"
							placeholder="Modelo"
							value={formularioVeiculo.modelo}
							onChange={(e) =>
								setFormularioVeiculo((prev) => ({
									...prev,
									modelo: e.target.value,
								}))
							}
							required
						/>
						<input
							type="number"
							placeholder="Quilometragem inicial"
							value={formularioVeiculo.quilometragem}
							onChange={(e) =>
								setFormularioVeiculo((prev) => ({
									...prev,
									quilometragem: e.target.value,
								}))
							}
							min="0"
						/>
						<button type="submit">Salvar veículo</button>
					</form>
				</section>

				<section className="card">
					<h2>
						{edicaoAbastecimentoId
							? "Editar Abastecimento"
							: "Registrar Abastecimento"}
					</h2>
					<form onSubmit={salvarAbastecimento} className="form">
						<select
							value={formularioAbastecimento.veiculoId}
							onChange={(e) =>
								setFormularioAbastecimento((prev) => ({
									...prev,
									veiculoId: e.target.value,
								}))
							}
							required
						>
							<option value="">Selecione o veículo</option>
							{dados.veiculos.map((veiculo) => (
								<option key={veiculo.id} value={veiculo.id}>
									{veiculo.placa} - {veiculo.modelo}
								</option>
							))}
						</select>
						<input
							type="date"
							value={formularioAbastecimento.data}
							onChange={(e) =>
								setFormularioAbastecimento((prev) => ({
									...prev,
									data: e.target.value,
								}))
							}
							required
						/>
						<input
							type="number"
							placeholder="Litros"
							value={formularioAbastecimento.litros}
							onChange={(e) =>
								setFormularioAbastecimento((prev) => ({
									...prev,
									litros: e.target.value,
								}))
							}
							min="0"
							step="0.01"
						/>
						<input
							type="number"
							placeholder="Valor total"
							value={formularioAbastecimento.valor}
							onChange={(e) =>
								setFormularioAbastecimento((prev) => ({
									...prev,
									valor: e.target.value,
								}))
							}
							min="0"
							step="0.01"
							required
						/>
						<input
							type="number"
							placeholder="Km no abastecimento"
							value={formularioAbastecimento.quilometragem}
							onChange={(e) =>
								setFormularioAbastecimento((prev) => ({
									...prev,
									quilometragem: e.target.value,
								}))
							}
							min="0"
						/>

						<div className="acoes-formulario">
							<button type="submit">
								{edicaoAbastecimentoId
									? "Atualizar abastecimento"
									: "Salvar abastecimento"}
							</button>
							{edicaoAbastecimentoId && (
								<button
									type="button"
									className="botao-secundario"
									onClick={limparFormularioAbastecimento}
								>
									Cancelar edição
								</button>
							)}
						</div>
					</form>
				</section>

				<section className="card">
					<h2>
						{edicaoManutencaoId ? "Editar Manutenção" : "Registrar Manutenção"}
					</h2>
					<form onSubmit={salvarManutencao} className="form">
						<select
							value={formularioManutencao.veiculoId}
							onChange={(e) =>
								setFormularioManutencao((prev) => ({
									...prev,
									veiculoId: e.target.value,
								}))
							}
							required
						>
							<option value="">Selecione o veículo</option>
							{dados.veiculos.map((veiculo) => (
								<option key={veiculo.id} value={veiculo.id}>
									{veiculo.placa} - {veiculo.modelo}
								</option>
							))}
						</select>
						<input
							type="date"
							value={formularioManutencao.data}
							onChange={(e) =>
								setFormularioManutencao((prev) => ({
									...prev,
									data: e.target.value,
								}))
							}
							required
						/>
						<input
							type="text"
							placeholder="Descrição da manutenção"
							value={formularioManutencao.descricao}
							onChange={(e) =>
								setFormularioManutencao((prev) => ({
									...prev,
									descricao: e.target.value,
								}))
							}
							required
						/>
						<input
							type="number"
							placeholder="Valor total"
							value={formularioManutencao.valor}
							onChange={(e) =>
								setFormularioManutencao((prev) => ({
									...prev,
									valor: e.target.value,
								}))
							}
							min="0"
							step="0.01"
							required
						/>
						<input
							type="number"
							placeholder="Km na manutenção"
							value={formularioManutencao.quilometragem}
							onChange={(e) =>
								setFormularioManutencao((prev) => ({
									...prev,
									quilometragem: e.target.value,
								}))
							}
							min="0"
						/>

						<div className="acoes-formulario">
							<button type="submit">
								{edicaoManutencaoId
									? "Atualizar manutenção"
									: "Salvar manutenção"}
							</button>
							{edicaoManutencaoId && (
								<button
									type="button"
									className="botao-secundario"
									onClick={limparFormularioManutencao}
								>
									Cancelar edição
								</button>
							)}
						</div>
					</form>
				</section>

				<section className="card card-wide">
					<div className="dashboard-header">
						<h2>Painel do Veículo</h2>
						<select
							value={veiculoSelecionadoId}
							onChange={(e) => setVeiculoSelecionadoId(e.target.value)}
						>
							<option value="">Selecione</option>
							{dados.veiculos.map((veiculo) => (
								<option key={veiculo.id} value={veiculo.id}>
									{veiculo.placa} - {veiculo.modelo}
								</option>
							))}
						</select>
					</div>

					{veiculoSelecionado ? (
						<>
							<div className="stats">
								<article>
									<h3>Último abastecimento</h3>
									<p>
										{ultimoAbastecimento
											? `${formatDate(ultimoAbastecimento.data)} | ${formatCurrency(ultimoAbastecimento.valor)}`
											: "Sem registro"}
									</p>
								</article>
								<article>
									<h3>Quilometragem do veículo</h3>
									<p>{quilometragemAtual.toLocaleString("pt-BR")} km</p>
								</article>
								<article>
									<h3>Última manutenção</h3>
									<p>
										{ultimaManutencao
											? `${formatDate(ultimaManutencao.data)} | ${ultimaManutencao.descricao} | ${formatCurrency(ultimaManutencao.valor)}`
											: "Sem registro"}
									</p>
								</article>
							</div>

							<h3>Lista de todos os abastecimentos</h3>
							<ul className="maintenance-list">
								{abastecimentosSelecionados.length === 0 && (
									<li>Nenhum abastecimento cadastrado.</li>
								)}
								{[...abastecimentosSelecionados]
									.sort((a, b) => new Date(b.data) - new Date(a.data))
									.map((item) => (
										<li key={item.id}>
											<span>{formatDate(item.data)}</span>
											<span>{item.litros.toLocaleString("pt-BR")} L</span>
											<span>
												{item.quilometragem.toLocaleString("pt-BR")} km
											</span>
											<strong>{formatCurrency(item.valor)}</strong>
											<div className="acoes-item">
												<button
													type="button"
													className="botao-secundario"
													onClick={() => editarAbastecimento(item)}
												>
													Editar
												</button>
												<button
													type="button"
													className="botao-perigo"
													onClick={() => excluirAbastecimento(item.id)}
												>
													Excluir
												</button>
											</div>
										</li>
									))}
							</ul>

							<h3>Lista de todas as manutenções</h3>
							<ul className="maintenance-list">
								{manutencoesSelecionadas.length === 0 && (
									<li>Nenhuma manutenção cadastrada.</li>
								)}
								{[...manutencoesSelecionadas]
									.sort((a, b) => new Date(b.data) - new Date(a.data))
									.map((item) => (
										<li key={item.id}>
											<span>{formatDate(item.data)}</span>
											<span>{item.descricao}</span>
											<span>
												{item.quilometragem.toLocaleString("pt-BR")} km
											</span>
											<strong>{formatCurrency(item.valor)}</strong>
											<div className="acoes-item">
												<button
													type="button"
													className="botao-secundario"
													onClick={() => editarManutencao(item)}
												>
													Editar
												</button>
												<button
													type="button"
													className="botao-perigo"
													onClick={() => excluirManutencao(item.id)}
												>
													Excluir
												</button>
											</div>
										</li>
									))}
							</ul>
						</>
					) : (
						<p>Cadastre e selecione um veículo para visualizar o painel.</p>
					)}
				</section>

				<section className="card card-wide">
					<h2>Somatória de Gastos</h2>
					<div className="filters">
						<label>
							Filtro:
							<select
								value={filtroTipoGasto}
								onChange={(e) => setFiltroTipoGasto(e.target.value)}
							>
								<option value="todos">Todos os gastos</option>
								<option value="abastecimento">Apenas abastecimentos</option>
								<option value="manutencao">Apenas manutenções</option>
							</select>
						</label>

						<label>
							Veículo:
							<select
								value={filtroVeiculoGasto}
								onChange={(e) => setFiltroVeiculoGasto(e.target.value)}
							>
								<option value="todos">Todos os veículos</option>
								{dados.veiculos.map((veiculo) => (
									<option key={veiculo.id} value={veiculo.id}>
										{veiculo.placa} - {veiculo.modelo}
									</option>
								))}
							</select>
						</label>

						<div className="filtros-tempo">
							<label>
								Data inicial:
								<input
									type="date"
									value={periodoInicio}
									onChange={(e) => setPeriodoInicio(e.target.value)}
								/>
							</label>

							<label>
								Data final:
								<input
									type="date"
									value={periodoFim}
									onChange={(e) => setPeriodoFim(e.target.value)}
								/>
							</label>

							<div className="filtros-tempo-acoes">
								<button
									type="button"
									className="botao-secundario"
									onClick={aplicarMesAtual}
								>
									Mês atual
								</button>
								<button
									type="button"
									className="botao-secundario"
									onClick={limparPeriodo}
								>
									Ver total geral
								</button>
							</div>
						</div>
					</div>

					<div className="totals">
						<p>
							Período aplicado:{" "}
							{periodoInicio || periodoFim
								? `${periodoInicio ? formatDate(periodoInicio) : "início"} até ${periodoFim ? formatDate(periodoFim) : "hoje"}`
								: "todos os períodos"}
						</p>
						<p>
							Total abastecimentos: {formatCurrency(totais.totalAbastecimentos)}
						</p>
						<p>Total manutenções: {formatCurrency(totais.totalManutencoes)}</p>
						<p className="highlight">
							Total filtrado: {formatCurrency(totalFiltrado)}
						</p>
					</div>
				</section>
			</main>
		</div>
	);
}
