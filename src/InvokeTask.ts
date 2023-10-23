import type {paths as ApiType} from '~/lib/openapi.js'
import type {Merge} from 'type-fest'

import * as lodash from 'lodash-es'
import {Simplify} from 'type-fest'

export type Scheduler = "ddim" | "ddpm" | "deis" | "dpmpp_2m" | "dpmpp_2m_k" | "dpmpp_2m_sde" | "dpmpp_2m_sde_k" | "dpmpp_2s" | "dpmpp_2s_k" | "dpmpp_sde" | "dpmpp_sde_k" | "euler" | "euler_a" | "euler_k" | "heun" | "heun_k" | "kdpm_2" | "kdpm_2_a" | "lms" | "lms_k" | "pndm" | "unipc"
export type Loras = Record<string, number>

type UnsetOptions = {
  boardId?: string
  loras?: Loras
  prompt: string
  seed?: number
  width?: number
}
type MergedOptions = Merge<typeof defaultOptions, UnsetOptions>

export type Options = Merge<Partial<typeof defaultOptions>, UnsetOptions>

export const defaultOptions = {
  cfgScale: 5,
  cpuNoise: false,
  fp32: true,
  height: 1024,
  highPriority: true,
  mirrorPromptToStyle: true,
  model: `stable-diffusion-xl-base-1-0`,
  negativePrompt: ``,
  negativeStylePrompt: ``,
  runs: 1,
  scheduler: <Scheduler> `unipc`,
  steps: 100,
  stylePrompt: ``,
}

type EnqueueBatchPostInput = ApiType["/api/v1/queue/{queue_id}/enqueue_batch"]["post"]["requestBody"]["content"]["application/json"]
type ApiGraph = EnqueueBatchPostInput["batch"]["graph"]
type Edge = {
  destination: {
    field: string
    node_id: string
  }
  source: {
    field: string
    node_id: string
  }
}

class InvokeNode {
  #node: unknown
  constructor(node: unknown) {
    this.#node = node
  }
  createEdge(ownOutput: string, otherNode: InvokeNode, otherInput: string): Edge {
    return {
      destination: {
        field: otherInput,
        // @ts-expect-error
        node_id: <string> otherNode.#node.id,
      },
      source: {
        field: ownOutput,
        // @ts-expect-error
        node_id: <string> this.#node.id,
      },
    }
  }
  toRaw() {
    return this.#node
  }
}
export class InvokeTask {
  negativeStyle: string
  nodes: ApiGraph["nodes"]
  options: MergedOptions
  seed: number
  style: string
  width: number
  constructor(options?: Options) {
    this.options = <MergedOptions> {
      ...defaultOptions,
      ...options,
    }
    this.width = this.options.width ?? this.options.height
    this.seed = this.options.seed ?? lodash.random(0, 2_147_483_647)
    this.style = [this.options.stylePrompt, this.options.mirrorPromptToStyle ? this.options.prompt : ``].filter(Boolean).join(`, `)
    this.negativeStyle = [this.options.negativeStylePrompt, this.options.mirrorPromptToStyle ? this.options.negativePrompt : ``].filter(Boolean).join(`, `)
    this.nodes = {
      // @ts-expect-error
      denoiseLatents: {
        cfg_scale: this.options.cfgScale,
        denoising_end: 1,
        denoising_start: 0,
        scheduler: this.options.scheduler,
        steps: this.options.steps,
        type: `denoise_latents`,
      },
      // @ts-expect-error
      latentsToImage: {
        fp32: this.options.fp32,
        type: `l2i`,
      },
      // @ts-expect-error
      metadata: {
        cfg_scale: this.options.cfgScale,
        controlnets: [],
        generation_mode: `sdxl_txt2img`,
        height: this.options.height,
        ipAdapters: [],
        loras: [],
        model: {
          base_model: `sdxl`,
          model_name: this.options.model,
          model_type: `main`,
        },
        negative_prompt: this.options.negativePrompt,
        negative_style_prompt: this.negativeStyle,
        positive_prompt: this.options.prompt,
        positive_style_prompt: this.style,
        rand_device: this.options.cpuNoise ? `cpu` : `cuda`,
        scheduler: this.options.scheduler,
        seed: this.seed,
        steps: this.options.steps,
        t2iAdapters: [],
        type: `metadata_accumulator`,
        width: this.width,
      },
      // @ts-expect-error
      model: {
        model: {
          base_model: `sdxl`,
          model_name: this.options.model,
          model_type: `main`,
        },
        type: `sdxl_model_loader`,
      },
      // @ts-expect-error
      negativePrompt: {
        prompt: this.options.negativePrompt,
        style: this.negativeStyle,
        type: `sdxl_compel_prompt`,
      },
      // @ts-expect-error
      noise: {
        height: this.options.height,
        seed: this.seed,
        type: `noise`,
        use_cpu: this.options.cpuNoise,
        width: this.width,
      },
      // @ts-expect-error
      positivePrompt: {
        prompt: this.options.prompt,
        style: this.style,
        type: `sdxl_compel_prompt`,
      },
      // @ts-expect-error
      saveImage: {
        is_intermediate: false,
        type: `save_image`,
      },
    }
    if (this.options.boardId) {
      // @ts-expect-error
      this.nodes.saveImage.board = {
        board_id: this.options.boardId,
      }
    }
    if (!lodash.isEmpty(this.options.loras)) {
      // @ts-expect-error
      this.nodes.metadata.loras = []
      for (const [index, [name, strength]] of Object.entries(this.options.loras).entries()) {
        // @ts-expect-error
        this.nodes.metadata.loras.push({
          lora: {
            base_model: `sdxl`,
            model_name: name,
          },
          weight: strength,
        })
        const nodeId = `lora${index}`
        // @ts-expect-error
        this.nodes![nodeId] = {
          lora: {
            base_model: `sdxl`,
            model_name: name,
          },
          type: `sdxl_lora_loader`,
          weight: strength,
        }
      }
    }
    this.nodes = lodash.mapValues(this.nodes, (node, key) => {
      return {
        // @ts-expect-error
        id: key,
        is_intermediate: true,
        ...node,
      }
    })
  }
  build(): EnqueueBatchPostInput {
    return {
      batch: {
        graph: {
          id: `sdxl_text_to_image_graph`,
          edges: this.buildEdges(),
          nodes: this.nodes,
        },
        runs: this.options.runs,
      },
      prepend: this.options.highPriority,
    }
  }
  toString() {
    return `${this.options.prompt} (${this.options.model}, ${this.options.scheduler}, ${this.options.steps} steps, CFG ${this.options.cfgScale})`
  }
  private buildEdges() {
    const nodes = Object.values(this.nodes!)
    const modelNode = new InvokeNode(nodes.find(node => node.type === `sdxl_model_loader`))
    const promptNode = new InvokeNode(nodes.find(node => node.type === `sdxl_compel_prompt` && !node.id.startsWith(`negative`)))
    const negativePromptNode = new InvokeNode(nodes.find(node => node.type === `sdxl_compel_prompt` && node.id.startsWith(`negative`)))
    const noiseNode = new InvokeNode(nodes.find(node => node.type === `noise`))
    const denoiseLatentsNode = new InvokeNode(nodes.find(node => node.type === `denoise_latents`))
    const latentsToImageNode = new InvokeNode(nodes.find(node => node.type === `l2i`))
    const saveImageNode = new InvokeNode(nodes.find(node => node.type === `save_image`))
    const metadataNode = new InvokeNode(nodes.find(node => node.type === `metadata_accumulator`))
    const loraNodes = nodes.filter(node => node.type === `sdxl_lora_loader`).map(node => new InvokeNode(node))
    const edges: Edge[] = [
      modelNode.createEdge(`vae`, latentsToImageNode, `vae`),
      promptNode.createEdge(`conditioning`, denoiseLatentsNode, `positive_conditioning`),
      negativePromptNode.createEdge(`conditioning`, denoiseLatentsNode, `negative_conditioning`),
      noiseNode.createEdge(`noise`, denoiseLatentsNode, `noise`),
      denoiseLatentsNode.createEdge(`latents`, latentsToImageNode, `latents`),
      metadataNode.createEdge(`metadata`, latentsToImageNode, `metadata`),
      metadataNode.createEdge(`metadata`, saveImageNode, `metadata`),
      latentsToImageNode.createEdge(`image`, saveImageNode, `image`),
    ]
    if (lodash.isEmpty(loraNodes)) {
      edges.push(modelNode.createEdge(`unet`, denoiseLatentsNode, `unet`))
      edges.push(modelNode.createEdge(`clip`, promptNode, `clip`))
      edges.push(modelNode.createEdge(`clip`, negativePromptNode, `clip`))
      edges.push(modelNode.createEdge(`clip2`, promptNode, `clip2`))
      edges.push(modelNode.createEdge(`clip2`, negativePromptNode, `clip2`))
    }
    for (const [index, loraNode] of loraNodes.entries()) {
      const isFirst = index === 0
      const isLast = index === loraNodes.length - 1
      if (isFirst) {
        edges.push(modelNode.createEdge(`unet`, loraNode, `unet`))
        edges.push(modelNode.createEdge(`clip`, loraNode, `clip`))
        edges.push(modelNode.createEdge(`clip2`, loraNode, `clip2`))
      }
      if (isLast) {
        edges.push(loraNode.createEdge(`unet`, denoiseLatentsNode, `unet`))
        edges.push(loraNode.createEdge(`clip`, promptNode, `clip`))
        edges.push(loraNode.createEdge(`clip`, negativePromptNode, `clip`))
        edges.push(loraNode.createEdge(`clip2`, promptNode, `clip2`))
        edges.push(loraNode.createEdge(`clip2`, negativePromptNode, `clip2`))
        break
      }
      const nextLoraNode = loraNodes[index + 1]
      edges.push(loraNode.createEdge(`unet`, nextLoraNode, `unet`))
      edges.push(loraNode.createEdge(`clip`, nextLoraNode, `clip`))
      edges.push(loraNode.createEdge(`clip2`, nextLoraNode, `clip2`))
    }
    return edges
  }
}
