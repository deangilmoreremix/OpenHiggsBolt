def clean_gitmodules(blob):
    if b"Open-AI-Design-Agent" in blob.data:
        content = blob.data.decode("utf-8")
        lines = content.split("\n")
        new_lines = []
        skip = False
        for line in lines:
            if "Open-AI-Design-Agent" in line:
                skip = True
                continue
            if skip and line.startswith("["):
                skip = False
            if not skip:
                new_lines.append(line)
        blob.data = "\n".join(new_lines).encode("utf-8")