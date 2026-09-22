"""Render a narrated demo from actual browser screencast frames.

Input: media/raw/sceneN/frames.json containing
  {"frames":[{"file":"00000.jpg","timestamp":1790000000.0},...],
   "startedAt":1790000000.0,"endedAt":1790000030.0}
Timestamps may be wall-clock seconds or milliseconds. They are only used for
relative frame durations. Never invent interaction frames. Extra narration time
holds the last captured application frame; audio is not sped up.
"""
import json, pathlib, subprocess, textwrap

ROOT=pathlib.Path(__file__).resolve().parent
TITLES=["01  A LITTLE DOUBT","02  THE SMALLEST EXCEPTION","03  CHANGE ONE EDGE","04  A FRAGILE CONNECTION","05  EVIDENCE, NOT A THEOREM","06  BUILT TO BE CHECKED"]

def duration(path):
 return float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',str(path)],text=True))

def call(args):
 subprocess.run(args,check=True)

def stamp(t):
 hours=int(t//3600);minutes=int(t%3600//60);seconds=int(t%60);millis=int(round((t-int(t))*1000))
 if millis==1000: seconds+=1;millis=0
 return f'{hours:02}:{minutes:02}:{seconds:02},{millis:03}'

def quote(path):return str(path).replace("'", "'\\''")

def main():
 (ROOT/'renders').mkdir(exist_ok=True)
 audio_durations=[duration(ROOT/f'scene-{i:02}.mp3') for i in range(1,7)]
 parts=[];offset=0;subtitles=[];chapter_lines=[];subtitle_index=0
 for i,audio_len in enumerate(audio_durations,1):
  scene=ROOT/'raw'/f'scene{i}';manifest=json.loads((scene/'frames.json').read_text())
  frames=manifest['frames'] if isinstance(manifest,dict) else manifest
  if not frames:raise ValueError(f'No real frames in scene {i}')
  def ftime(frame):
   value=frame.get('timestamp',frame.get('at',frame.get('time')))
   if value is None:raise ValueError('Every frame needs its captured timestamp')
   return float(value)/1000 if float(value)>1e11 else float(value)
  times=[ftime(f) for f in frames]
  if any(b<a for a,b in zip(times,times[1:])):raise ValueError('Frame times are not monotonic')
  target=audio_len+1.5
  records=[]
  for index,frame in enumerate(frames):
   name=frame.get('file',frame.get('path'));path=pathlib.Path(name)
   if not path.is_absolute():path=scene/path
   if not path.exists():raise ValueError(f'Missing captured frame: {path}')
   delta=times[index+1]-times[index] if index+1<len(frames) else 1.0
   records.extend([f"file '{quote(path)}'",f'duration {max(delta,0.001):.6f}'])
  records.append(f"file '{quote(path)}'")
  concat=ROOT/'renders'/f'scene-{i:02}.ffconcat';concat.write_text('\n'.join(records)+'\n')
  label=ROOT/'renders'/f'title-{i:02}.txt';label.write_text(TITLES[i-1])
  rendered=ROOT/'renders'/f'scene-{i:02}.mp4';parts.append(rendered)
  vf=f"scale=1920:980:force_original_aspect_ratio=decrease:flags=lanczos,pad=1920:1080:(ow-iw)/2:70:color=0xf5f4ed,setsar=1,tpad=stop_mode=clone:stop_duration={target:.3f},drawbox=x=0:y=0:w=iw:h=64:color=0x252b27:t=fill,drawtext=fontfile=/System/Library/Fonts/Monaco.ttf:textfile='{label}':fontcolor=0xf0df68:fontsize=20:x=40:y=23,drawtext=fontfile=/System/Library/Fonts/Monaco.ttf:text='COUNTERSEED  /  GIBC V2':fontcolor=0xc1c8b0:fontsize=16:x=w-tw-40:y=25"
  call(['ffmpeg','-y','-v','warning','-f','concat','-safe','0','-i',str(concat),'-i',str(ROOT/f'scene-{i:02}.mp3'),'-vf',vf,'-af','adelay=500|500,apad','-t',f'{target:.3f}','-r','30','-c:v','libx264','-preset','medium','-crf','19','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-movflags','+faststart',str(rendered)])
  text=(ROOT/f'scene-{i:02}.txt').read_text().strip();words=text.split();chunks=[];chunk=[]
  for word in words:
   chunk.append(word)
   if len(' '.join(chunk))>100 and (word.endswith(('.',',',';',':')) or len(chunk)>=23):chunks.append(' '.join(chunk));chunk=[]
  if chunk:chunks.append(' '.join(chunk))
  spoken=0;word_total=sum(len(c.split()) for c in chunks)
  for chunk in chunks:
   start=offset+.5+audio_len*spoken/word_total;spoken+=len(chunk.split());end=offset+.5+audio_len*spoken/word_total;subtitle_index+=1
   subtitles.append(f'{subtitle_index}\n{stamp(start)} --> {stamp(end)}\n'+ '\n'.join(textwrap.wrap(chunk,72))+'\n')
  chapter_lines.append(f'{int(offset//60):02}:{int(offset%60):02} {TITLES[i-1][4:].title()}')
  offset+=target
 final_concat=ROOT/'renders'/'final.ffconcat';final_concat.write_text('\n'.join(f"file '{quote(p)}'" for p in parts)+'\n')
 (ROOT/'counterseed-demo.srt').write_text('\n'.join(subtitles))
 (ROOT/'CHAPTERS.txt').write_text('\n'.join(chapter_lines)+'\n')
 call(['ffmpeg','-y','-v','warning','-f','concat','-safe','0','-i',str(final_concat),'-i',str(ROOT/'counterseed-demo.srt'),'-map','0:v','-map','0:a','-map','1:0','-c','copy','-c:s','mov_text','-metadata:s:s:0','language=eng','-metadata','title=Counterseed — Find the beautiful exception','-metadata','comment=Actual application screencast. Stock synthetic narration. Bounded graph experiments, not unbounded theorem proofs.','-movflags','+faststart',str(ROOT/'counterseed-demo.mp4')])
 print(json.dumps({'video':str(ROOT/'counterseed-demo.mp4'),'duration':duration(ROOT/'counterseed-demo.mp4'),'chapters':chapter_lines},indent=2))

if __name__=='__main__':main()
