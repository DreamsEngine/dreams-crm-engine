"use client";

import { useEffect, useState } from "react";

const LINES = [
	{ pre: "Made with love by ", brand: "Dreams Engine", post: "" },
	{ pre: "Hecho con cariño por ", brand: "Dreams Engine", post: "" },
	{ pre: "", brand: "ドリームズエンジン", post: "が心を込めて作りました" },
] as const;

const ROTATE_MS = 4000;

export function MadeWithLove({ className }: { className?: string }) {
	const [index, setIndex] = useState(0);

	useEffect(() => {
		const timer = setInterval(
			() => setIndex((current) => (current + 1) % LINES.length),
			ROTATE_MS,
		);
		return () => clearInterval(timer);
	}, []);

	const line = LINES[index] ?? LINES[0];

	return (
		<p className={className} aria-live="off">
			<span
				key={index}
				className="motion-safe:fade-in motion-safe:slide-in-from-bottom-1 inline-block motion-safe:animate-in motion-safe:duration-500"
			>
				{line.pre}
				<a
					href="https://dreamsengine.com"
					target="_blank"
					rel="noreferrer"
					className="underline underline-offset-4 hover:text-foreground"
				>
					{line.brand}
				</a>
				{line.post}
			</span>
		</p>
	);
}
